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

export type PaymentProviderId = "MOYASAR" | "TAMARA" | "MOCK" | "MANUAL";

/**
 * How the customer reaches the provider.
 *
 * HOSTED_FORM - the provider's script renders card fields inside our page.
 * REDIRECT    - navigate the browser to `redirectUrl` on the provider's domain.
 */
export type PaymentFlow = "HOSTED_FORM" | "REDIRECT";

/** Why a method is offered but cannot be used for this order. */
export type MethodUnavailableReason =
  | "BELOW_MINIMUM"
  | "ABOVE_MAXIMUM"
  | "NOT_ELIGIBLE"
  | "PROVIDER_DOWN"
  | "EMAIL_REQUIRED";

export interface PaymentMethodOption {
  id: "CARD" | "TAMARA";
  provider: PaymentProviderId;
  flow: PaymentFlow;
  available: boolean;
  /** BNPL only: how many instalments the customer is eligible for. */
  instalments?: number;
  /** SAR per instalment, for display. Already rounded by the server. */
  instalmentAmount?: number;
  descriptionEn?: string;
  descriptionAr?: string;
  unavailableReason?: MethodUnavailableReason | null;
}

export interface InitiatedPayment {
  paymentId: string;
  provider: PaymentProviderId;
  flow: PaymentFlow;
  /** Present only when flow === "REDIRECT". Send the browser here. */
  redirectUrl?: string;
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

/**
 * Which ways this customer can pay for this order.
 *
 * Depends on the basket and the customer, so unlike `getPaymentConfig` it must
 * not be cached or shared. A method that exists but cannot be used comes back
 * with `available: false` and a reason rather than being omitted.
 */
export async function getPaymentMethods(
  orderId: string,
): Promise<{ methods: PaymentMethodOption[] }> {
  return apiClient.get("/payments/methods", { params: { orderId } });
}

/**
 * Is this somewhere we are willing to send the customer?
 *
 * The URL comes from our own API, so this is defence in depth - but it is the
 * difference between a compromised response being a bug and being an open
 * redirect that phishes payment details. Matched on the host suffix with a
 * leading dot so `tamara.co.evil.com` cannot pass.
 */
export function isTrustedRedirect(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return hostname === "tamara.co" || hostname.endsWith(".tamara.co");
  } catch {
    return false;
  }
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
  /** Omit for the card flow. TAMARA is only valid for purpose=ORDER. */
  provider?: "MOYASAR" | "TAMARA";
  /** Locale for the provider-hosted page. */
  locale?: "en" | "ar";
  isMobile?: boolean;
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
