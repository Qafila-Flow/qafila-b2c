"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  ShoppingBag,
  CheckCircle,
  Package,
  Truck,
  CircleCheck,
  Clock,
} from "lucide-react";
import type { OrderStatus, VendorOrderResponse } from "@/types/order";
import {
  STATUS_ORDER,
  formatOrderDate,
  isTerminal,
  statusDate,
} from "@/lib/order-status";

const TIMELINE_STEPS: {
  key: string;
  icon: typeof ShoppingBag;
  /** The status this step represents, for looking up its real date. */
  status: OrderStatus;
  /** Statuses that mean "you are standing on this step right now". */
  statuses: OrderStatus[];
}[] = [
  {
    key: "orderPlaced",
    icon: ShoppingBag,
    status: "PLACED",
    statuses: ["PLACED", "PENDING"],
  },
  { key: "confirmed", icon: CheckCircle, status: "CONFIRMED", statuses: ["CONFIRMED"] },
  { key: "packed", icon: Package, status: "PACKED", statuses: ["PACKED"] },
  { key: "shipped", icon: Truck, status: "SHIPPED", statuses: ["SHIPPED"] },
  { key: "delivered", icon: CircleCheck, status: "DELIVERED", statuses: ["DELIVERED"] },
];

interface Props {
  /**
   * The SHIPMENT this timeline describes.
   *
   * One timeline per shipment, not one per order: in a multi-vendor order each
   * vendor packs and ships on their own schedule, and a single rail across all
   * of them can only show the slowest — which is what it used to do, silently.
   */
  shipment: VendorOrderResponse;
  /** Tighter spacing when several of these are stacked on one page. */
  compact?: boolean;
}

export default function OrderStatusTimeline({ shipment, compact }: Props) {
  const t = useTranslations("orders");
  const locale = useLocale();

  const status = shipment.status;
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (isTerminal(status)) {
    const stoppedAt = statusDate(shipment, status);
    return (
      <div className="flex items-center gap-3 rounded-lg bg-discount/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-discount/10">
          <Clock size={20} className="text-discount" />
        </div>
        <div>
          <p className="text-sm font-semibold text-discount">
            {t(status.toLowerCase() as never)}
          </p>
          <p className="text-xs text-gray-text">
            {t(`statusDescriptions.${status}` as never)}
            {stoppedAt ? ` · ${formatOrderDate(stoppedAt, locale)}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const stepIndex = STATUS_ORDER.indexOf(step.status);
        const isReached = currentIndex >= stepIndex;
        const isCurrentStep = step.statuses.includes(status);
        const Icon = step.icon;
        const isLast = i === TIMELINE_STEPS.length - 1;

        // The real date this step happened, from the shipment's transition
        // history. Null for steps recorded before the history existed — better
        // no date than the order-creation date printed against "Delivered".
        const reachedAt = isReached ? statusDate(shipment, step.status) : null;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isReached
                    ? "bg-dark text-white"
                    : "border-2 border-gray-border dark:border-gray-600 bg-white dark:bg-dark text-gray-text"
                }`}
              >
                <Icon size={14} />
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${compact ? "min-h-5" : "min-h-8"} ${
                    isReached && !isCurrentStep ? "bg-dark" : "bg-gray-border"
                  }`}
                />
              )}
            </div>

            {/* Text */}
            <div className={isLast ? "pb-0" : compact ? "pb-4" : "pb-6"}>
              <p
                className={`text-sm font-semibold ${
                  isReached ? "text-dark dark:text-gray-100" : "text-gray-text"
                }`}
              >
                {t(step.key as never)}
                {reachedAt && (
                  <span className="ms-2 text-xs font-normal text-gray-text">
                    {formatOrderDate(reachedAt, locale)}
                  </span>
                )}
              </p>
              {isCurrentStep && (
                <p className="mt-0.5 text-xs text-gray-text">
                  {t(`statusDescriptions.${status}` as never)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
