import crypto from 'crypto';
import Razorpay from 'razorpay';
import type { PaymentProvider, CreatePaymentInput, CreatePaymentResult, VerifyPaymentInput, VerifyPaymentResult } from './provider';

// NOT used unless PAYMENT_MODE=razorpay. Isolated so importing this file
// is never required for the app to run in simulation mode.
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay';

  private client(): Razorpay {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — required when PAYMENT_MODE=razorpay.');
    }
    return new Razorpay({ key_id, key_secret });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const order = await this.client().orders.create({ amount: input.amount, currency: input.currency, receipt: input.orderId });
    return { paymentId: order.id, providerOrderId: order.id, status: 'processing' };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const razorpay_order_id = input.razorpay_order_id as string;
    const razorpay_payment_id = input.razorpay_payment_id as string;
    const razorpay_signature = input.razorpay_signature as string;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return { verified: false, reason: 'RAZORPAY_KEY_SECRET not set' };

    const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    return expected === razorpay_signature ? { verified: true } : { verified: false, reason: 'Signature mismatch' };
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string }> {
    const payment = await this.client().payments.fetch(paymentId);
    return { status: payment.status };
  }
}
