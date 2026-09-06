export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  clientSecret?: string;
}
