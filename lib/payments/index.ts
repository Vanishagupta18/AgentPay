import type { PaymentProvider } from './provider';
import { SimulationPaymentProvider } from './simulation-provider';

export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_MODE ?? 'simulation';
  if (mode === 'razorpay') {
    const { RazorpayPaymentProvider } = require('./razorpay-provider');
    return new RazorpayPaymentProvider();
  }
  return new SimulationPaymentProvider();
}
