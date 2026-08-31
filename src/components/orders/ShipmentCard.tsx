"use client";

import { useTranslations, useLocale } from "next-intl";
import { BadgeCheck, Store, Truck } from "lucide-react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";
import type { OrderStatus, VendorOrderResponse } from "@/types/order";
import OrderStatusTimeline from "./OrderStatusTimeline";
import OrderItemsList from "./OrderItemsList";
import { isTerminal } from "@/lib/order-status";

function statusChipClass(status: OrderStatus): string {
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

interface Props {
  shipment: VendorOrderResponse;
  /** 1-based position, shown only when the order has more than one. */
  index?: number;
  total?: number;
}

/**
 * One vendor's parcel.
 *
 * The order detail page used to flatten every shipment into a single item list
 * under a single timeline, which meant a customer with two vendors could not
 * tell which half of their order had shipped, who was holding the other half,
 * or why one tracking number covered neither. The post-checkout confirmation
 * screen had always grouped them properly — this brings the rest of the
 * account in line with it.
 */
export default function ShipmentCard({ shipment, index, total }: Props) {
  const t = useTranslations("orders");
  const locale = useLocale();

  const storeName =
    (locale === "ar" ? shipment.vendor?.storeNameAr : shipment.vendor?.storeName) ??
    shipment.vendor?.storeName ??
    t("shipmentFallbackStore");

  const isMulti = (total ?? 1) > 1;
  const dimmed = isTerminal(shipment.status);

  return (
    <div
      className={`rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark ${
        dimmed ? "opacity-75" : ""
      }`}
    >
      {/* ── Header: who is shipping this, and how far along it is ────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-border dark:border-gray-700 p-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-light dark:bg-gray-800">
          {shipment.vendor?.logo ? (
            <Image
              src={getMediaUrl(shipment.vendor.logo) || shipment.vendor.logo}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Store size={16} className="text-gray-text" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-dark dark:text-gray-100">
            <span className="truncate">{storeName}</span>
            {shipment.vendor?.isVerified && (
              <BadgeCheck size={14} className="shrink-0 text-primary" />
            )}
          </p>
          {isMulti && (
            <p className="text-xs text-gray-text">
              {t("shipmentOf", { index: index ?? 1, total: total ?? 1 })}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusChipClass(
            shipment.status,
          )}`}
        >
          {t(shipment.status.toLowerCase() as never)}
        </span>
      </div>

      {/* ── This shipment's own timeline ──────────────────────────────────── */}
      <div className="border-b border-gray-border dark:border-gray-700 p-4">
        <OrderStatusTimeline shipment={shipment} compact />
      </div>

      {/* ── Tracking, when there is any ───────────────────────────────────── */}
      {shipment.trackingNumber && (
        <div className="flex items-center gap-2 border-b border-gray-border dark:border-gray-700 px-4 py-3">
          <Truck size={15} className="shrink-0 text-gray-text" />
          <span className="text-xs text-gray-text">
            {shipment.carrier ? `${shipment.carrier} · ` : ""}
            {t("trackingNumber")}
          </span>
          {shipment.carrierCode === "SPL" ? (
            <a
              href={`https://splonline.com.sa/en/tracking/?id=${encodeURIComponent(shipment.trackingNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-auto font-mono text-xs font-semibold text-dark underline underline-offset-2 dark:text-gray-200"
              dir="ltr"
            >
              {shipment.trackingNumber}
            </a>
          ) : (
            <span className="ms-auto font-mono text-xs font-semibold text-dark dark:text-gray-200" dir="ltr">
              {shipment.trackingNumber}
            </span>
          )}
        </div>
      )}

      {/* ── Items in this parcel ──────────────────────────────────────────── */}
      <div className="px-4">
        <OrderItemsList items={shipment.items} locale={locale} />
      </div>
    </div>
  );
}
