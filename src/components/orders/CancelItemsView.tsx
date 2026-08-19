"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Package, Store, X } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";
import { cancelOrderItem } from "@/lib/api/orders";
import type {
  OrderResponse,
  CancellationReason,
  VendorOrderResponse,
} from "@/types/order";
import { isCancellable } from "@/lib/order-status";

const CANCEL_REASONS: { key: CancellationReason; translationKey: string }[] = [
  { key: "CHANGED_MIND", translationKey: "CHANGED_MIND" },
  { key: "NO_LONGER_NEEDED", translationKey: "NO_LONGER_NEEDED" },
  { key: "BELIEVE_FAKE", translationKey: "BELIEVE_FAKE" },
  { key: "NO_REASON", translationKey: "NO_REASON" },
];

interface Props {
  order: OrderResponse;
  onBack: () => void;
  onCancelled: () => void;
}

/**
 * Cancel items, grouped by the shipment they belong to.
 *
 * The list used to be flattened across every vendor, so a customer could not
 * see that half their selection belonged to a parcel that had already left —
 * and the request for those items would simply fail. Items in a shipment past
 * the cancellation window are still shown, disabled, with the reason on the
 * row: "you cannot cancel this" is information, and hiding the row just makes
 * the order look like it lost items.
 */
export default function CancelItemsView({ order, onBack, onCancelled }: Props) {
  const t = useTranslations("orders");
  const locale = useLocale();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] =
    useState<CancellationReason>("CHANGED_MIND");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipments that still have something to cancel, open ones first.
  const shipments = order.vendorOrders
    .map((shipment) => ({
      shipment,
      open: isCancellable(shipment.status),
      items: shipment.items.filter((i) => i.status === "ACTIVE"),
    }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => Number(b.open) - Number(a.open));

  const cancellableCount = shipments
    .filter((g) => g.open)
    .reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);

  const handleConfirmCancel = async () => {
    if (!selectedItemId) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelOrderItem(order.id, selectedItemId, selectedReason);
      setShowReasonModal(false);
      setSelectedItemId(null);
      onCancelled();
    } catch (e: unknown) {
      // A swallowed error here used to look identical to success: the modal
      // closed, nothing changed, and the customer believed the item was gone.
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("cancelFailed");
      setError(Array.isArray(message) ? message[0] : String(message));
    } finally {
      setCancelling(false);
    }
  };

  const storeNameOf = (shipment: VendorOrderResponse) =>
    (locale === "ar" ? shipment.vendor?.storeNameAr : shipment.vendor?.storeName) ??
    shipment.vendor?.storeName ??
    t("shipmentFallbackStore");

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-dark dark:text-gray-200"
      >
        <ArrowLeft size={18} className="rtl:rotate-180" />
        {t("cancelItem")}
      </button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: items, grouped by shipment */}
        <div className="space-y-4 lg:col-span-3">
          {shipments.map(({ shipment, open, items }) => (
            <div
              key={shipment.id}
              className={`rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark ${
                open ? "" : "opacity-70"
              }`}
            >
              {/* Which vendor, and whether this parcel can still be stopped */}
              <div className="flex items-center gap-2 border-b border-gray-border dark:border-gray-700 px-6 py-3">
                <Store size={15} className="shrink-0 text-gray-text" />
                <span className="truncate text-sm font-semibold text-dark dark:text-gray-100">
                  {storeNameOf(shipment)}
                </span>
                {!open && (
                  <span className="ms-auto shrink-0 rounded-full bg-gray-light dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-text">
                    {t("shipmentTooLate", {
                      status: t(shipment.status.toLowerCase() as never),
                    })}
                  </span>
                )}
              </div>

              <div className="divide-y divide-gray-border dark:divide-gray-700 px-6">
                {items.map((item) => {
                  const title =
                    locale === "ar" ? item.productTitleAr : item.productTitle;
                  const isSelected = selectedItemId === item.id;

                  const variantParts: string[] = [];
                  if (item.variantDetails) {
                    const v = item.variantDetails;
                    if (v.color)
                      variantParts.push(
                        locale === "ar" && v.colorAr ? v.colorAr : v.color,
                      );
                    if (v.size)
                      variantParts.push(
                        locale === "ar" && v.sizeAr ? v.sizeAr : v.size,
                      );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 py-4 ${
                        open ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (!open) return;
                        setSelectedItemId(isSelected ? null : item.id);
                        setError(null);
                      }}
                    >
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-light dark:bg-gray-800">
                        {item.productImage ? (
                          <Image
                            src={getMediaUrl(item.productImage) || item.productImage}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package size={18} className="text-gray-text" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-dark dark:text-gray-100">
                          {title}
                        </p>
                        {variantParts.length > 0 && (
                          <p className="truncate text-xs text-gray-text">
                            {variantParts.join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-dark dark:text-gray-100" dir="ltr">
                          <SarIcon /> {Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      {open && (
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            isSelected
                              ? "border-dark bg-dark dark:border-gray-300 dark:bg-gray-300"
                              : "border-gray-border dark:border-gray-600 bg-white dark:bg-dark"
                          }`}
                        >
                          {isSelected && (
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                              <path
                                d="M1 5L4.5 8.5L11 1.5"
                                stroke="currentColor"
                                className="text-white dark:text-dark"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: warning + button */}
        <div className="self-start rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6 lg:col-span-2">
          <p className="mb-4 text-sm text-gray-text">
            {cancellableCount === 0
              ? t("nothingCancellable")
              : selectedItemId
                ? t("cannotBeReversed")
                : t("noItemSelected")}
          </p>

          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-discount/10 p-3 text-xs text-discount">
              <AlertCircle size={14} className="mt-px shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            onClick={() => selectedItemId && setShowReasonModal(true)}
            disabled={!selectedItemId}
            className={`w-full rounded-full py-3 text-sm font-semibold transition-colors ${
              selectedItemId
                ? "bg-dark text-white hover:bg-dark/90"
                : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
            }`}
          >
            {t("cancelTheSelectedItem")}
          </button>
        </div>
      </div>

      {/* Reason modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark dark:text-gray-100">
                {t("reasonForCancellation")}
              </h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} className="text-gray-text" />
              </button>
            </div>

            <div className="space-y-1">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason.key}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 hover:bg-gray-50 dark:hover:bg-dark/80"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedReason === reason.key
                        ? "border-dark dark:border-gray-300"
                        : "border-gray-border dark:border-gray-600"
                    }`}
                  >
                    {selectedReason === reason.key && (
                      <div className="h-2.5 w-2.5 rounded-full bg-dark dark:bg-gray-300" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={reason.key}
                    checked={selectedReason === reason.key}
                    onChange={() => setSelectedReason(reason.key)}
                    className="sr-only"
                  />
                  <span className="text-sm text-dark dark:text-gray-200">
                    {t(`reasons.${reason.translationKey}` as never)}
                  </span>
                </label>
              ))}
            </div>

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-discount/10 p-3 text-xs text-discount">
                <AlertCircle size={14} className="mt-px shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="mt-5 w-full rounded-full bg-dark py-3.5 text-sm font-semibold text-white transition-colors hover:bg-dark/90 disabled:opacity-50"
            >
              {cancelling ? t("cancelling") : t("confirmCancellation")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
