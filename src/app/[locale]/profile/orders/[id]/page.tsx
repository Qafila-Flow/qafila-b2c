"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/lib/api/orders";
import type { OrderResponse, OrderStatus } from "@/types/order";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import OrderItemsList from "@/components/orders/OrderItemsList";
import CancelItemsView from "@/components/orders/CancelItemsView";
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import SarIcon from "@/components/shared/SarIcon";
import DownloadInvoiceButton from "@/components/orders/DownloadInvoiceButton";

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
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-border border-t-primary" />
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

  const canCancel = ["PENDING", "PLACED", "CONFIRMED"].includes(order.status);
  const allItems = order.vendorOrders.flatMap((vo) => vo.items);
  const activeItems = allItems.filter((i) => i.status === "ACTIVE");
  const itemCount = allItems.reduce((s, i) => s + i.quantity, 0);

  // Cancel view
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
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-text hover:text-dark"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t("back")}
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Order Status Timeline */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <h2 className="mb-5 text-base font-bold text-dark dark:text-gray-100">
              {t("orderStatus")}
            </h2>
            <OrderStatusTimeline status={order.status} createdAt={order.createdAt} />
          </div>

          {/* Items Summary */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <h2 className="mb-4 text-base font-bold text-dark dark:text-gray-100">
              {t("itemsSummary")} ({itemCount}{" "}
              {itemCount > 1 ? t("items", { count: itemCount }) : t("item", { count: itemCount })})
            </h2>
            <OrderItemsList items={allItems} locale={locale} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Order ID + reload */}
          <div className="flex items-center justify-between rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-6 py-4">
            <span className="text-sm font-semibold text-dark">
              {t("orderNumber")} #{shortId}
            </span>
            <button
              onClick={fetchOrder}
              className="rounded-full border border-primary p-1.5 text-primary transition-colors hover:bg-primary/5"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Delivery Address */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-dark">
                {t("deliveryAddress")}
              </h2>
            </div>
            <div className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-dark" />
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold text-dark">{t("name")}:</span>{" "}
                  <span className="text-gray-text">
                    {addr.firstName} {addr.lastName}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-dark">
                    {t("phoneNumber")}:
                  </span>{" "}
                  <span className="text-gray-text">{addr.phoneNumber}</span>
                </p>
                <p>
                  <span className="font-semibold text-dark">
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
                <span className="text-dark">
                  {t("subtotal")} ({itemCount}{" "}
                  {itemCount > 1 ? t("items", { count: itemCount }) : t("item", { count: itemCount })})
                </span>
                <span className="font-medium" dir="ltr">
                  <SarIcon /> {Number(order.subtotal).toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark">{t("savingsDiscounts")}</span>
                  <span className="font-medium text-primary" dir="ltr">
                    - <SarIcon /> {Number(order.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark">{t("shippingFee")}</span>
                <span className="font-medium text-green" dir="ltr">
                  {order.shippingFee > 0
                    ? <><SarIcon /> {Number(order.shippingFee).toFixed(2)}</>
                    : t("free")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-border dark:border-gray-700 pt-3">
                <span className="font-bold text-dark">
                  {t("totalVatIncluded")}{" "}
                  <span className="text-xs font-normal text-gray-text">
                    {t("vatIncluded")}
                  </span>
                </span>
                <span className="font-bold text-dark" dir="ltr">
                  <SarIcon /> {Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

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
