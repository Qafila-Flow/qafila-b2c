"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { getOrder } from "@/lib/api/orders";
import { getPayment, type PaymentResponse } from "@/lib/api/payments";
import type { OrderResponse } from "@/types/order";
import OrderConfirmation from "@/components/orders/OrderConfirmation";

/**
 * Where the payment provider sends the customer back to.
 *
 * The query string says what the provider *thinks* happened; the API has
 * already re-read the real status from the provider before redirecting here.
 * Even so this page polls rather than trusting the parameters, because the
 * webhook and the redirect race each other — the customer can arrive a beat
 * before the payment is marked settled.
 */

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 12_000;

const SETTLED: PaymentResponse["status"][] = [
  "PAID",
  "CAPTURED",
  "FAILED",
  "VOIDED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "ABANDONED",
];

type View = "loading" | "paid" | "failed" | "pending" | "error";

function ResultPageInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { refreshCart } = useCart();

  const paymentId = searchParams.get("paymentId");

  const [view, setView] = useState<View>("loading");
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [message, setMessage] = useState("");
  const cartRefreshed = useRef(false);

  const settle = useCallback(
    async (settledPayment: PaymentResponse) => {
      setPayment(settledPayment);

      if (settledPayment.status === "PAID" || settledPayment.status === "CAPTURED") {
        if (settledPayment.orderId) {
          try {
            setOrder(await getOrder(settledPayment.orderId));
          } catch {
            // The money is in and the order is placed; a failed fetch here is a
            // display problem, not a payment problem.
          }
        }
        // The server emptied the cart when the payment settled — mirror that
        // locally so the header count is not stale.
        if (!cartRefreshed.current) {
          cartRefreshed.current = true;
          void refreshCart();
        }
        setView("paid");
        return;
      }

      setMessage(settledPayment.failureMessage ?? "");
      setView("failed");
    },
    [refreshCart],
  );

  const poll = useCallback(async () => {
    if (!paymentId) {
      setView("error");
      setMessage(t("payment.missingPayment"));
      return;
    }

    setView("loading");
    const startedAt = Date.now();

    for (;;) {
      try {
        const current = await getPayment(paymentId);

        if (SETTLED.includes(current.status)) {
          await settle(current);
          return;
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPayment(current);
          setView("pending");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      } catch (e) {
        setMessage(e instanceof Error ? e.message : t("payment.initFailed"));
        setView("error");
        return;
      }
    }
  }, [paymentId, settle, t]);

  useEffect(() => {
    void poll();
  }, [poll]);

  if (view === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
        <p className="text-sm text-gray-text">{t("payment.confirming")}</p>
      </div>
    );
  }

  if (view === "paid" && payment?.purpose === "SUBSCRIPTION") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-primary" />
        <h1 className="mb-3 text-2xl font-bold text-dark dark:text-gray-100">
          {t("payment.subscriptionActiveTitle")}
        </h1>
        <p className="mb-8 text-sm text-gray-text">
          {t("payment.subscriptionActiveBody")}
        </p>
        <Link
          href="/profile/subscription"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t("payment.viewSubscription")}
        </Link>
      </div>
    );
  }

  if (view === "paid" && order) {
    return <OrderConfirmation order={order} />;
  }

  // Paid, but the order could not be loaded for display.
  if (view === "paid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-dark dark:text-gray-100">
          {t("checkout.orderPlaced")}
        </h1>
        <p className="mb-8 text-sm text-gray-text">
          {t("payment.paidNoOrderView")}
        </p>
        <Link
          href="/profile/orders"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t("checkout.viewOrders")}
        </Link>
      </div>
    );
  }

  if (view === "pending") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Clock size={40} className="mx-auto mb-4 text-primary" />
        <h1 className="mb-3 text-2xl font-bold text-dark dark:text-gray-100">
          {t("payment.stillProcessingTitle")}
        </h1>
        <p className="mb-8 text-sm text-gray-text">
          {t("payment.stillProcessingBody")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => void poll()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <RefreshCw size={16} />
            {t("payment.checkAgain")}
          </button>
          <Link
            href="/profile/orders"
            className="rounded-full border border-gray-border dark:border-gray-700 px-6 py-2.5 text-sm font-semibold text-dark dark:text-gray-100"
          >
            {t("checkout.viewOrders")}
          </Link>
        </div>
      </div>
    );
  }

  // failed | error
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <AlertCircle size={40} className="mx-auto mb-4 text-discount" />
      <h1 className="mb-3 text-2xl font-bold text-dark dark:text-gray-100">
        {t("payment.failedTitle")}
      </h1>
      <p className="mb-2 text-sm text-gray-text">{t("payment.failedBody")}</p>
      {message && (
        <p className="mb-8 text-sm text-discount" dir="auto">
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {payment?.orderId && (
          <Link
            href={`/checkout/payment?orderId=${payment.orderId}`}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {t("payment.tryAnotherCard")}
          </Link>
        )}
        <Link
          href="/cart"
          className="rounded-full border border-gray-border dark:border-gray-700 px-6 py-2.5 text-sm font-semibold text-dark dark:text-gray-100"
        >
          {t("payment.backToCart")}
        </Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
        </div>
      }
    >
      <ResultPageInner />
    </Suspense>
  );
}
