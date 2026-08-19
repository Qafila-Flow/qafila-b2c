"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOrder } from "@/lib/api/orders";
import {
  getPaymentConfig,
  initiatePayment,
  type BillingCycle,
  type InitiatedPayment,
  type PaymentConfig,
} from "@/lib/api/payments";
import type { OrderResponse } from "@/types/order";
import MoyasarForm from "@/components/payments/MoyasarForm";
import MockPaymentPanel from "@/components/payments/MockPaymentPanel";
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
 */

function idempotencyKeyFor(target: string): string {
  const storageKey = `qafila_payment_key_${target}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  return key;
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
  const [intent, setIntent] = useState<InitiatedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const start = useCallback(async () => {
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

        // Already settled — don't show a card form for money we have.
        if (loadedOrder.paymentStatus === "PAID") {
          router.replace(`/profile/orders/${orderId}`);
          return;
        }
        setOrder(loadedOrder);
      }

      const created = await initiatePayment({
        purpose: orderId ? "ORDER" : "SUBSCRIPTION",
        targetId: (orderId ?? planId) as string,
        ...(planId ? { billingCycle: cycle } : {}),
        // Absolute, and must match an origin the API allows — this is the
        // open-redirect allowlist, so a new domain needs an env change too.
        returnUrl: `${window.location.origin}/${locale}/checkout/result`,
        idempotencyKey: idempotencyKeyFor(
          orderId ? `order_${orderId}` : `plan_${planId}_${cycle}`,
        ),
      });

      setIntent(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("payment.initFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderId, planId, cycle, locale, router, t]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    void start();
  }, [isLoggedIn, start]);

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
              onClick={() => void start()}
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

      {!loading && !error && intent && config && (
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
                  {order ? order.orderNumber : intent.description}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm text-gray-text">{t("payment.amountDue")}</p>
                <p
                  className="text-xl font-bold text-dark dark:text-gray-100"
                  dir="ltr"
                >
                  <SarIcon /> {intent.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-dark dark:text-gray-100">
                {t("checkout.paymentMethod")}
              </h2>
            </div>

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
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
              <p>{t("payment.securityNote")}</p>
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-text">
              <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
              <p>{t("payment.threeDsNote")}</p>
            </div>
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
