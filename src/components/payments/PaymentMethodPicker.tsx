"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import type {
  MethodUnavailableReason,
  PaymentMethodOption,
} from "@/lib/api/payments";
import SarIcon from "@/components/shared/SarIcon";

/**
 * How the customer chooses to pay.
 *
 * A method that exists but cannot be used for this order is rendered disabled
 * with the reason, never hidden. "Why can I not use Tamara" is a support ticket
 * otherwise, and the answer is usually something the customer can fix - a
 * bigger basket, or an email address.
 *
 * EMAIL_REQUIRED is the exception: it is a reason the method is *selectable*,
 * because picking it is what triggers the one-field step that resolves it.
 */

interface PaymentMethodPickerProps {
  methods: PaymentMethodOption[];
  selected: PaymentMethodOption["id"] | null;
  onSelect: (id: PaymentMethodOption["id"]) => void;
  disabled?: boolean;
}

/** Latin digits in both locales, per the platform-wide numeral rule. */
function formatAmount(value: number, locale: string): string {
  return value.toLocaleString(`${locale}-u-nu-latn`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCount(value: number, locale: string): string {
  return value.toLocaleString(`${locale}-u-nu-latn`);
}

export default function PaymentMethodPicker({
  methods,
  selected,
  onSelect,
  disabled = false,
}: PaymentMethodPickerProps) {
  const t = useTranslations();
  const locale = useLocale();

  // EMAIL_REQUIRED still lets the customer pick: the email step comes next.
  const isSelectable = (method: PaymentMethodOption): boolean =>
    method.available && !disabled;

  const reasonText = (
    reason: MethodUnavailableReason | null | undefined,
  ): string | null => {
    switch (reason) {
      case "BELOW_MINIMUM":
        return t("payment.tamaraBelowMinimum");
      case "ABOVE_MAXIMUM":
        return t("payment.tamaraAboveMaximum");
      case "PROVIDER_DOWN":
        return t("payment.tamaraProviderDown");
      case "NOT_ELIGIBLE":
        return t("payment.tamaraUnavailable");
      // Not a blocker - the email step handles it once Tamara is picked.
      case "EMAIL_REQUIRED":
        return null;
      default:
        return null;
    }
  };

  return (
    <div role="radiogroup" aria-label={t("payment.chooseMethod")} className="space-y-3">
      {methods.map((method) => {
        const selectable = isSelectable(method);
        const isSelected = selected === method.id;
        const reason = reasonText(method.unavailableReason);

        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!selectable}
            onClick={() => selectable && onSelect(method.id)}
            className={[
              "flex w-full items-start gap-3 rounded-xl border p-4 text-start transition",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-gray-border dark:border-gray-700",
              selectable
                ? "cursor-pointer hover:border-primary"
                : "cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                isSelected
                  ? "border-primary"
                  : "border-gray-border dark:border-gray-600",
              ].join(" ")}
            >
              {isSelected && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              {method.id === "CARD" ? (
                <>
                  <span className="flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    <span className="font-semibold text-dark dark:text-gray-100">
                      {t("payment.methodCard")}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-gray-text">
                    {t("payment.methodCardNote")}
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Image
                      src="/images/tamara.svg"
                      alt="Tamara"
                      width={72}
                      height={20}
                      className="h-5 w-auto"
                    />
                    <span className="font-semibold text-dark dark:text-gray-100">
                      {t("payment.methodTamara")}
                    </span>
                  </span>

                  {method.instalments && method.instalmentAmount ? (
                    <span className="mt-1 block text-sm text-gray-text">
                      {t("payment.tamaraInstalment", {
                        count: formatCount(method.instalments, locale),
                      })}{" "}
                      <span dir="ltr" className="whitespace-nowrap font-medium">
                        <SarIcon />{" "}
                        {formatAmount(method.instalmentAmount, locale)}
                      </span>
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm text-gray-text">
                      {t("payment.methodTamaraNoteGeneric")}
                    </span>
                  )}

                  {reason && (
                    <span className="mt-2 block text-xs text-discount">
                      {reason}
                    </span>
                  )}
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
