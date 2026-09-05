export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  providerOrderId: string | null;
  status: 'processing';
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  [key: string]: unknown;
}

export interface VerifyPaymentResult {
  verified: boolean;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  getPaymentStatus(paymentId: string): Promise<{ status: string }>;
}
