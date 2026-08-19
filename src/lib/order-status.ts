import type { OrderStatus, VendorOrderResponse } from "@/types/order";

/**
 * Client-side mirror of the server's order rules.
 *
 * Only what the UI needs to render: which statuses are terminal, how far along
 * a shipment is, and whether it can still be cancelled. The authority is the
 * backend (`qafila/src/orders/order-status.ts`) — every action is re-validated
 * there, so this exists to avoid offering a button that would 400, not to
 * decide anything on its own.
 */

export const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

export const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

/**
 * How late a customer may cancel. Must match CANCELLABLE_BY_CUSTOMER on the
 * server — once a vendor has PACKED, work has been done.
 */
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  "PENDING",
  "PLACED",
  "CONFIRMED",
];

export const isTerminal = (status: OrderStatus): boolean =>
  TERMINAL_STATUSES.includes(status);

export const isCancellable = (status: OrderStatus): boolean =>
  CANCELLABLE_STATUSES.includes(status);

/** Can anything on this order still be cancelled? */
export const hasCancellableShipment = (
  shipments: VendorOrderResponse[],
): boolean => shipments.some((s) => isCancellable(s.status));

/**
 * How many shipments have arrived, out of the ones still live.
 *
 * Cancelled shipments are excluded from BOTH figures: "1 of 2 delivered" is
 * misleading when the second was cancelled and is never coming.
 */
export function deliveryProgress(shipments: VendorOrderResponse[]): {
  delivered: number;
  live: number;
  allDelivered: boolean;
} {
  const live = shipments.filter((s) => !isTerminal(s.status));
  const delivered = live.filter((s) => s.status === "DELIVERED").length;
  return {
    delivered,
    live: live.length,
    allDelivered: live.length > 0 && delivered === live.length,
  };
}

/**
 * When a shipment reached a given status, from its transition history.
 *
 * Returns null when there is no event for it — which is the normal case for
 * shipments created before the history table existed. Callers fall back to a
 * dateless step rather than printing a wrong one; the timeline used to stamp
 * the ORDER's creation date next to every step, so "Delivered" showed the day
 * the customer checked out.
 */
export function statusDate(
  shipment: VendorOrderResponse,
  status: OrderStatus,
): string | null {
  const event = shipment.statusEvents?.find((e) => e.toStatus === status);
  if (event) return event.createdAt;

  // Fall back to the dedicated columns, which are populated even for shipments
  // that predate the event log.
  if (status === "SHIPPED" && shipment.shippedAt) return shipment.shippedAt;
  if (status === "DELIVERED" && shipment.deliveredAt) return shipment.deliveredAt;
  if (status === "CANCELLED" && shipment.cancelledAt) return shipment.cancelledAt;
  if (status === "PLACED" || status === "PENDING") return shipment.createdAt;

  return null;
}

/**
 * Date formatter for order screens.
 *
 * `ar-SA` alone resolves to the Umm al-Qura calendar and Arabic-Indic digits,
 * which is not what this product shows anywhere else — the platform is Western
 * digits and Gregorian dates in both locales. The extensions pin both.
 */
export function formatOrderDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { weekday: "short", day: "numeric", month: "short" },
  );
}
