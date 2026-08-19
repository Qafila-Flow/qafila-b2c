"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/api/orders";
import type { OrderResponse, OrderStatus } from "@/types/order";
import { Package, ChevronRight, ShoppingBag, Store } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";
import { deliveryProgress, formatOrderDate } from "@/lib/order-status";

const STATUS_TABS = ["all", "active", "completed", "cancelled"] as const;
type TabKey = (typeof STATUS_TABS)[number];

/**
 * Which order statuses each tab covers.
 *
 * `Order.status` is a rollup of the shipments beneath it, so "completed" now
 * genuinely means every parcel arrived. Before the rollup existed this field
 * was frozen at PLACED for the life of the order, and the completed tab was
 * permanently empty.
 */
const TAB_FILTERS: Record<TabKey, OrderStatus[] | null> = {
  all: null,
  active: ["PENDING", "PLACED", "CONFIRMED", "PACKED", "SHIPPED"],
  completed: ["DELIVERED"],
  cancelled: ["CANCELLED", "REFUNDED"],
};

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "DELIVERED":
      return "bg-green/10 text-green";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-discount/10 text-discount";
    case "SHIPPED":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
    case "PENDING":
      return "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400";
    default:
      return "bg-primary/10 text-primary";
  }
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const statuses = TAB_FILTERS[activeTab];

    const fetchOrders = async () => {
      try {
        // One request per tab, whatever the tab spans — the backend takes a
        // list of statuses, so pagination stays real.
        const res = await getMyOrders({
          page,
          limit: 10,
          ...(statuses ? { statuses } : {}),
        });
        setOrders(res.data);
        setTotalPages(Math.max(1, res.totalPages));
      } catch {
        setOrders([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, page]);

  const allItems = (order: OrderResponse) =>
    order.vendorOrders.flatMap((vo) => vo.items);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-dark dark:text-gray-100">
        {t("title")}
      </h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-border dark:border-gray-700 bg-gray-light dark:bg-dark p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-dark/50 text-dark dark:text-gray-100 shadow-sm"
                : "text-gray-text hover:text-dark dark:hover:text-gray-200"
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-border border-t-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="mb-4 text-gray-border" />
          <h2 className="mb-2 text-lg font-semibold text-dark dark:text-gray-100">
            {t("empty")}
          </h2>
          <p className="mb-6 max-w-sm text-sm text-gray-text">
            {t("emptyDescription")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <ShoppingBag size={16} />
            {t("shopNow")}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const items = allItems(order);
              const itemCount = items.reduce((s, i) => s + i.quantity, 0);
              const firstItem = items[0];
              const shipmentCount = order.vendorOrders.length;
              const progress = deliveryProgress(order.vendorOrders);

              return (
                <Link
                  key={order.id}
                  href={`/profile/orders/${order.id}`}
                  className="flex items-center gap-4 rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-4 transition-colors hover:border-gray-text"
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-light dark:bg-gray-800">
                    {firstItem?.productImage ? (
                      <Image
                        src={getMediaUrl(firstItem.productImage) || firstItem.productImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={20} className="text-gray-text" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-dark dark:text-gray-100">
                        {t("orderNumber")} #{order.orderNumber.split("-").pop()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(order.status)}`}
                      >
                        {t(order.status.toLowerCase() as never)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-text">
                      {formatOrderDate(order.createdAt, locale)} ·{" "}
                      {itemCount > 1
                        ? t("items", { count: itemCount })
                        : t("item", { count: itemCount })}
                    </p>

                    {/*
                      A multi-vendor order arrives in pieces, on different days.
                      Saying so on the card is the difference between "where is
                      my order" and "one of my two parcels is still coming".
                    */}
                    {shipmentCount > 1 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-text">
                        <Store size={11} className="shrink-0" />
                        {progress.live > 0
                          ? t("shipmentsDelivered", {
                              delivered: progress.delivered,
                              total: progress.live,
                            })
                          : t("shipmentsTitle", { count: shipmentCount })}
                      </p>
                    )}

                    <p className="mt-1 text-sm font-bold text-dark dark:text-gray-100" dir="ltr">
                      <SarIcon /> {Number(order.total).toFixed(2)}
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-gray-text rtl:rotate-180"
                  />
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-gray-border dark:border-gray-700 px-4 py-2 text-sm font-medium text-dark dark:text-gray-200 disabled:opacity-40"
              >
                {t("previous")}
              </button>
              <span className="text-sm text-gray-text" dir="ltr">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-gray-border dark:border-gray-700 px-4 py-2 text-sm font-medium text-dark dark:text-gray-200 disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
