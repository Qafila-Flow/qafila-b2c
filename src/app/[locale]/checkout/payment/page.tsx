"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import {
  getPaymentConfig,
  getPaymentMethods,
  initiatePayment,
  isTrustedRedirect,
  type BillingCycle,
  type InitiatedPayment,
  type PaymentConfig,
  type PaymentMethodOption,
} from "@/lib/api/payments";
import type { OrderResponse } from "@/types/order";
import MoyasarForm from "@/components/payments/MoyasarForm";
import MockPaymentPanel from "@/components/payments/MockPaymentPanel";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";
import TamaraRedirect from "@/components/payments/TamaraRedirect";
import TamaraEmailStep from "@/components/payments/TamaraEmailStep";
import SarIcon from "@/components/shared/SarIcon";

/**
 * Card entry step, for anything the customer pays for.
 *
 * Takes either `?orderId=` (a marketplace order) or `?planId=&cycle=` (a
 * subscription). Both end up in the same place — one payment intent, one hosted
 * card form, one provider callback — because the difference between them is
 * what the server charges for, not how the card is collected.
 *
 * Split out of the checkout page on purpose: an order already exists in PENDING
 * by the time the customer gets here, so a reload, a back button or a declined
 * card never re-creates it. The payment intent is keyed by an idempotency key
 * held in sessionStorage, so refreshing reuses the same payment rather than
 * leaving a trail of abandoned ones.
 *
 * ── Two steps, not one ─────────────────────────────────────────────────────
 *
 * With more than one gateway the page can no longer create a payment on mount:
 * it has to know which one first. So an order asks the API which methods it can
 * offer, renders a picker, and only then initiates. When there is a single
 * method (subscriptions, or a deployment with BNPL off) it is auto-selected and
 * the flow looks exactly as it did before — one extra request, no extra click.
 */

function idempotencyKeyFor(target: string): string {
  const storageKey = `qafila_payment_key_${target}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  return key;
}

function clearIdempotencyKey(target: string): void {
  sessionStorage.removeItem(`qafila_payment_key_${target}`);
}

function PaymentPageInner() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();

  const orderId = searchParams.get("orderId");
  const planId = searchParams.get("planId");
  const cycle = (searchParams.get("cycle") ?? "MONTHLY") as BillingCycle;

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [selected, setSelected] = useState<PaymentMethodOption["id"] | null>(
    null,
  );
  const [intent, setIntent] = useState<InitiatedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [error, setError] = useState("");

  /**
   * The idempotency key varies by provider: switching from a declined card to
   * Tamara must create a new payment, not return the failed card one.
   */
  const targetKey = useCallback(
    (provider: "MOYASAR" | "TAMARA") =>
      (orderId ? `order_${orderId}` : `plan_${planId}_${cycle}`) +
      `_${provider}`,
    [orderId, planId, cycle],
  );

  // ── Step one: what can this customer pay with? ────────────────────────────
  const load = useCallback(async () => {
    if (!orderId && !planId) {
      setError(t("payment.missingOrder"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loadedConfig = await getPaymentConfig();
      setConfig(loadedConfig);

      if (orderId) {
        const loadedOrder = await getOrder(orderId);

        // Already settled — don't show a payment form for money we have.
        if (loadedOrder.paymentStatus === "PAID") {
          router.replace(`/profile/orders/${orderId}`);
          return;
        }
        setOrder(loadedOrder);

        const { methods: available } = await getPaymentMethods(orderId);
        setMethods(available);

        // Auto-select when there is nothing to choose between, so the
        // card-only path is unchanged from the customer's point of view.
        const selectable = available.filter((method) => method.available);
        if (selectable.length === 1) setSelected(selectable[0].id);
      } else {
        // Subscriptions are card-only: BNPL on a recurring charge is not a
        // product we offer, and the API refuses it anyway.
        setMethods([
          {
            id: "CARD",
            provider: loadedConfig.provider.toUpperCase() as "MOYASAR",
            flow: "HOSTED_FORM",
            available: true,
          },
        ]);
        setSelected("CARD");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("payment.initFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderId, planId, router, t]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [isLoggedIn, load]);

  // ── Step two: create the payment for the chosen method ────────────────────
  const prepare = useCallback(
    async (methodId: PaymentMethodOption["id"]) => {
      const provider = methodId === "TAMARA" ? "TAMARA" : "MOYASAR";
      const key = targetKey(provider);

      setPreparing(true);
      setError("");
      setNeedsEmail(false);

      try {
        const created = await initiatePayment({
          purpose: orderId ? "ORDER" : "SUBSCRIPTION",
          targetId: (orderId ?? planId) as string,
          ...(planId ? { billingCycle: cycle } : {}),
          ...(methodId === "TAMARA" ? { provider: "TAMARA" as const } : {}),
          locale: locale === "ar" ? "ar" : "en",
          isMobile:
            typeof window !== "undefined" && window.innerWidth < 768,
          // Absolute, and must match an origin the API allows — this is the
          // open-redirect allowlist, so a new domain needs an env change too.
          returnUrl: `${window.location.origin}/${locale}/checkout/result`,
          idempotencyKey: idempotencyKeyFor(key),
        });

        setIntent(created);
        return created;
      } catch (e) {
        // Machine-readable, never the message: it is translated.
        if (e instanceof ApiError && e.code === "EMAIL_REQUIRED") {
          setNeedsEmail(true);
          return null;
        }

        // Both mean "Tamara cannot be used for this order" and both are
        // actionable by the customer — fix the delivery phone, or pay by card.
        // Neither is worth a retry, so say so rather than showing initFailed.
        if (
          e instanceof ApiError &&
          (e.code === "PHONE_INVALID" || e.code === "TAMARA_REJECTED")
        ) {
          setError(
            e.code === "PHONE_INVALID"
              ? t("payment.tamaraPhoneInvalid")
              : t("payment.tamaraUnavailable"),
          );
          setSelected("CARD");
          return null;
        }

        // A redirect session that timed out at the provider cannot be reused.
        // Drop the key so the retry opens a fresh one.
        if (e instanceof ApiError && e.status === 409) {
          clearIdempotencyKey(key);
        }

        setError(e instanceof Error ? e.message : t("payment.initFailed"));
        return null;
      } finally {
        setPreparing(false);
      }
    },
    [orderId, planId, cycle, locale, targetKey, t],
  );

  // Card is prepared as soon as it is chosen, so the form can render.
  useEffect(() => {
    if (selected !== "CARD") return;
    if (intent?.flow === "HOSTED_FORM") return;
    void prepare("CARD");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const goToTamara = useCallback(async () => {
    setRedirecting(true);

    const created = intent?.flow === "REDIRECT" ? intent : await prepare("TAMARA");

    if (!created?.redirectUrl) {
      setRedirecting(false);
      return;
    }

    // Defence in depth: the URL came from our own API, but this is the
    // difference between a compromised response being a bug and being an open
    // redirect that phishes payment details.
    if (!isTrustedRedirect(created.redirectUrl)) {
      setError(t("payment.untrustedRedirect"));
      setRedirecting(false);
      return;
    }

    window.location.assign(created.redirectUrl);
  }, [intent, prepare, t]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
        <p className="mb-6 text-lg text-gray-text">
          {t("checkout.loginRequired")}
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  const tamaraMethod = methods.find((method) => method.id === "TAMARA");
  const amount = intent?.amount ?? Number(order?.total ?? 0);
  const showPicker = methods.length > 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-dark dark:text-gray-100">
        {t("payment.title")}
      </h1>
      <p className="mb-6 text-sm text-gray-text">{t("payment.subtitle")}</p>

      {loading && (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
          <div className="mb-4 rounded-lg bg-discount/10 p-4 text-sm text-discount">
            {error}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void load()}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              {t("payment.tryAgain")}
            </button>
            <Link
              href="/cart"
              className="rounded-full border border-gray-border dark:border-gray-700 px-6 py-2.5 text-sm font-semibold text-dark dark:text-gray-100"
            >
              {t("payment.backToCart")}
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && config && (
        <div className="space-y-6">
          {/* What is being charged, from the server's own numbers. */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-text">
                  {order ? t("checkout.orderNumber") : t("payment.paymentFor")}
                </p>
                <p
                  className="font-semibold text-dark dark:text-gray-100"
                  dir={order ? "ltr" : undefined}
                >
                  {order ? order.orderNumber : (intent?.description ?? "")}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm text-gray-text">{t("payment.amountDue")}</p>
                <p
                  className="text-xl font-bold text-dark dark:text-gray-100"
                  dir="ltr"
                >
                  <SarIcon /> {amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-dark dark:text-gray-100">
                {showPicker
                  ? t("payment.chooseMethod")
                  : t("checkout.paymentMethod")}
              </h2>
            </div>

            {showPicker && (
              <div className="mb-6">
                <PaymentMethodPicker
                  methods={methods}
                  selected={selected}
                  onSelect={(id) => {
                    setSelected(id);
                    setIntent(null);
                    setNeedsEmail(false);
                    setError("");
                  }}
                  disabled={preparing || redirecting}
                />
              </div>
            )}

            {preparing && !intent && (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
              </div>
            )}

            {selected === "CARD" && intent?.flow === "HOSTED_FORM" && (
              <>
                {config.provider === "mock" ? (
                  <MockPaymentPanel
                    intent={intent}
                    onError={(message) => setError(message)}
                  />
                ) : (
                  <MoyasarForm
                    intent={intent}
                    config={config}
                    onError={(message) => setError(message)}
                  />
                )}

                <div className="mt-5 flex items-start gap-2 text-xs text-gray-text">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-primary"
                  />
                  <p>{t("payment.securityNote")}</p>
                </div>
                <div className="mt-2 flex items-start gap-2 text-xs text-gray-text">
                  <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
                  <p>{t("payment.threeDsNote")}</p>
                </div>
              </>
            )}

            {selected === "TAMARA" && tamaraMethod && (
              <>
                {needsEmail ? (
                  <TamaraEmailStep
                    onSaved={() => {
                      setNeedsEmail(false);
                      // The reason it was blocked is gone; carry straight on.
                      void goToTamara();
                    }}
                  />
                ) : (
                  <TamaraRedirect
                    method={tamaraMethod}
                    total={amount}
                    redirecting={redirecting || preparing}
                    onContinue={() => void goToTamara()}
                  />
                )}
              </>
            )}

            {!selected && showPicker && (
              <p className="text-sm text-gray-text">
                {t("payment.selectMethodPrompt")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
        </div>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}
