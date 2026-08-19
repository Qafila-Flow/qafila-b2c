"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/lib/api/orders";
import type { OrderResponse } from "@/types/order";
import ShipmentCard from "@/components/orders/ShipmentCard";
import CancelItemsView from "@/components/orders/CancelItemsView";
import { ArrowLeft, CreditCard, MapPin, RefreshCw, Package } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import DownloadInvoiceButton from "@/components/orders/DownloadInvoiceButton";
import {
  deliveryProgress,
  hasCancellableShipment,
} from "@/lib/order-status";

export default function OrderDetailPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"detail" | "cancel">("detail");

  const fetchOrder = async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-border dark:border-gray-700 border-t-primary dark:border-t-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-sm text-gray-text">
        Order not found.
      </div>
    );
  }

  const shipments = order.vendorOrders;

  /**
   * Cancellation is decided per shipment, never from `order.status`.
   *
   * `order.status` is a rollup, and it used to be a frozen one — reading it
   * here is what let a customer cancel an order every vendor had already
   * delivered. The button appears only if at least one parcel is still early
   * enough to stop.
   */
  const canCancel = hasCancellableShipment(shipments);
  const activeItems = shipments
    .flatMap((s) => s.items)
    .filter((i) => i.status === "ACTIVE");
  const itemCount = shipments
    .flatMap((s) => s.items)
    .reduce((sum, i) => sum + i.quantity, 0);

  const progress = deliveryProgress(shipments);

  if (view === "cancel") {
    return (
      <CancelItemsView
        order={order}
        onBack={() => setView("detail")}
        onCancelled={() => {
          setView("detail");
          fetchOrder();
        }}
      />
    );
  }

  const shortId = order.orderNumber.split("-").pop();
  const addr = order.shippingAddress;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/profile/orders")}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-text hover:text-dark dark:hover:text-gray-100"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t("back")}
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: the caravan ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-dark dark:text-gray-100">
              {shipments.length > 1
                ? t("shipmentsTitle", { count: shipments.length })
                : t("orderStatus")}
            </h2>
            {/* Only worth saying when there is more than one parcel in play. */}
            {shipments.length > 1 && progress.live > 0 && (
              <span className="text-xs text-gray-text">
                {t("shipmentsDelivered", {
                  delivered: progress.delivered,
                  total: progress.live,
                })}
              </span>
            )}
          </div>

          {shipments.map((shipment, i) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              index={i + 1}
              total={shipments.length}
            />
          ))}
        </div>

        {/* ── Right: the order itself ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Order ID + reload */}
          <div className="flex items-center justify-between rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-6 py-4">
            <div>
              <span className="text-sm font-semibold text-dark dark:text-gray-200">
                {t("orderNumber")} #{shortId}
              </span>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-text">
                <Package size={12} />
                {itemCount > 1
                  ? t("items", { count: itemCount })
                  : t("item", { count: itemCount })}
              </p>
            </div>
            <button
              onClick={fetchOrder}
              className="rounded-full border border-primary p-1.5 text-primary transition-colors hover:bg-primary/5"
              aria-label={t("refresh")}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Delivery Address */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-dark dark:text-gray-100">
                {t("deliveryAddress")}
              </h2>
            </div>
            <div className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-dark dark:text-gray-200" />
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold text-dark dark:text-gray-200">{t("name")}:</span>{" "}
                  <span className="text-gray-text">
                    {addr.firstName} {addr.lastName}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-dark dark:text-gray-200">
                    {t("phoneNumber")}:
                  </span>{" "}
                  <span className="text-gray-text" dir="ltr">{addr.phoneNumber}</span>
                </p>
                <p>
                  <span className="font-semibold text-dark dark:text-gray-200">
                    {t("address")}:
                  </span>{" "}
                  <span className="text-gray-text">
                    {addr.street}, {addr.area}, {addr.city}
                    {addr.apartmentNo ? `, ${addr.apartmentNo}` : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <h2 className="mb-4 text-base font-bold text-dark dark:text-gray-100">
              {t("paymentSummary")}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark dark:text-gray-200">
                  {t("subtotal")} ({itemCount}{" "}
                  {itemCount > 1 ? t("items", { count: itemCount }) : t("item", { count: itemCount })})
                </span>
                <span className="font-medium" dir="ltr">
                  <SarIcon /> {Number(order.subtotal).toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark dark:text-gray-200">{t("savingsDiscounts")}</span>
                  <span className="font-medium text-primary" dir="ltr">
                    - <SarIcon /> {Number(order.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark dark:text-gray-200">{t("shippingFee")}</span>
                <span className="font-medium text-green" dir="ltr">
                  {order.shippingFee > 0
                    ? <><SarIcon /> {Number(order.shippingFee).toFixed(2)}</>
                    : t("free")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-border dark:border-gray-700 pt-3">
                <span className="font-bold text-dark dark:text-gray-100">
                  {t("totalVatIncluded")}{" "}
                  <span className="text-xs font-normal text-gray-text">
                    {t("vatIncluded")}
                  </span>
                </span>
                <span className="font-bold text-dark dark:text-gray-100" dir="ltr">
                  <SarIcon /> {Number(order.total).toFixed(2)}
                </span>
              </div>

              {/*
                Cancelled items are refunded without rewriting the order's
                totals — those record what was charged. Saying so here stops
                the summary looking wrong to a customer who just cancelled
                something and sees the same total as before.
              */}
              {(order.paymentStatus === "PARTIALLY_REFUNDED" ||
                order.paymentStatus === "REFUNDED") && (
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-gray-text">
                  {t("refundInProgress")}
                </p>
              )}
            </div>
          </div>

          {/*
            An unpaid order is not a dead end. Checkout deliberately leaves the
            order PENDING when a card is declined or the customer closes the
            tab mid-3DS, so this is the way back to it — without it, "you can
            try again with another card" is only true if the customer never
            navigates away.
          */}
          {order.status === "PENDING" && order.paymentStatus !== "PAID" && (
            <Link
              href={`/checkout/payment?orderId=${order.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <CreditCard size={16} />
              {t("completePayment")}
            </Link>
          )}

          {/* Invoice — available for the life of the order, not just at checkout */}
          {order.paymentStatus === "PAID" && (
            <DownloadInvoiceButton
              orderId={order.id}
              orderNumber={order.orderNumber}
            />
          )}

          {/* Cancel button */}
          {canCancel && activeItems.length > 0 && (
            <button
              onClick={() => setView("cancel")}
              className="w-full rounded-full border-2 border-dark dark:border-gray-400 py-3 text-sm font-semibold text-dark dark:text-gray-200 transition-colors hover:bg-dark hover:text-white"
            >
              {t("cancelItems")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
