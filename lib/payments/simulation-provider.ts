import crypto from 'crypto';
import type { PaymentProvider, CreatePaymentInput, CreatePaymentResult, VerifyPaymentInput, VerifyPaymentResult } from './provider';

// Same-process handshake between create -> simulate -> verify. Not
// persisted to Mongo on purpose — restarting the dev server clears it,
// which is fine for a hackathon build and documented in the README.
const simulatedOutcomes = new Map<string, 'success' | 'failure'>();

export function recordSimulatedOutcome(paymentId: string, outcome: 'success' | 'failure') {
  simulatedOutcomes.set(paymentId, outcome);
}

export class SimulationPaymentProvider implements PaymentProvider {
  readonly name = 'simulation';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const paymentId = `sim_${crypto.randomBytes(10).toString('hex')}`;
    return { paymentId, providerOrderId: null, status: 'processing' };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const outcome = simulatedOutcomes.get(input.paymentId);
    if (!outcome) {
      return { verified: false, reason: 'No simulated outcome recorded yet — call /api/payments/simulate first.' };
    }
    return outcome === 'success'
      ? { verified: true }
      : { verified: false, reason: 'Simulated payment failure (user selected "Simulate Payment Failure").' };
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string }> {
    const outcome = simulatedOutcomes.get(paymentId);
    if (!outcome) return { status: 'processing' };
    return { status: outcome === 'success' ? 'succeeded' : 'failed' };
  }
}
