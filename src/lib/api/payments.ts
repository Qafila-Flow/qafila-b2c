import apiClient from "./client";

/**
 * Payment API.
 *
 * Card details never pass through here — they go straight from the browser to
 * the payment provider via its hosted form. All this layer moves is amounts,
 * ids and statuses.
 */

export type PaymentTxStatus =
  | "INITIATED"
  | "PENDING_3DS"
  | "AUTHORIZED"
  | "CAPTURED"
  | "PAID"
  | "FAILED"
  | "VOIDED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "ABANDONED";

export interface PaymentConfig {
  provider: string;
  /** Publishable key — public by design. The secret key never leaves the API. */
  publishableKey: string;
  methods: string[];
  supportedNetworks: string[];
  currency: string;
  /** Present only when Apple Pay is enabled for this deployment. */
  applePay?: {
    country: string;
    label: string;
    validateMerchantUrl: string;
  };
}

export interface InitiatedPayment {
  paymentId: string;
  purpose: "ORDER" | "SUBSCRIPTION";
  /** SAR, for display only. */
  amount: number;
  /** Halalas — this is what the form must charge. Never recompute it here. */
  amountMinor: number;
  currency: string;
  description: string;
  /** Pass verbatim to the form as callback_url. */
  callbackUrl: string;
  /** Pass verbatim to the form as metadata. */
  metadata: Record<string, string>;
  expiresAt: string | null;
}

export interface PaymentResponse {
  id: string;
  provider: string;
  purpose: "ORDER" | "SUBSCRIPTION";
  status: PaymentTxStatus;
  orderId: string | null;
  orderNumber: string | null;
  amount: number;
  currency: string;
  refundedAmount: number;
  methodType: string;
  cardBrand: string | null;
  cardLast4: string | null;
  failureMessage: string | null;
  createdAt: string;
  paidAt: string | null;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return apiClient.get("/payments/config");
}

export type BillingCycle = "MONTHLY" | "ANNUALLY";

export async function initiatePayment(dto: {
  purpose: "ORDER" | "SUBSCRIPTION";
  /** Order id for ORDER, plan id for SUBSCRIPTION. */
  targetId: string;
  returnUrl: string;
  /** Required for SUBSCRIPTION, ignored for ORDER. */
  billingCycle?: BillingCycle;
  idempotencyKey?: string;
}): Promise<InitiatedPayment> {
  return apiClient.post("/payments/initiate", dto);
}

/**
 * Report the provider's payment id back to us.
 *
 * Called before the 3DS redirect so a payment abandoned at the bank's challenge
 * page is still traceable and can be reconciled.
 */
export async function attachProviderPayment(
  paymentId: string,
  providerPaymentId: string,
): Promise<PaymentResponse> {
  return apiClient.post(`/payments/${paymentId}/attach`, { providerPaymentId });
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  return apiClient.get(`/payments/${paymentId}`);
}
