"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { PaymentMethodOption } from "@/lib/api/payments";
import SarIcon from "@/components/shared/SarIcon";

/**
 * The hand-off to Tamara.
 *
 * Deliberately does not create the session itself - the page owns that, so
 * error handling, the email step and the redirect host check all live in one
 * place rather than being split across two components that can disagree.
 */

interface TamaraRedirectProps {
  method: PaymentMethodOption;
  total: number;
  redirecting: boolean;
  onContinue: () => void;
}

function formatAmount(value: number, locale: string): string {
  return value.toLocaleString(`${locale}-u-nu-latn`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TamaraRedirect({
  method,
  total,
  redirecting,
  onContinue,
}: TamaraRedirectProps) {
  const t = useTranslations();
  const locale = useLocale();

  const instalments = method.instalments ?? 0;
  // Prefer the server's figure; it already accounts for how Tamara splits an
  // amount that does not divide evenly.
  const perInstalment =
    method.instalmentAmount ?? (instalments > 0 ? total / instalments : total);

  return (
    <div className="rounded-xl border border-[#EDBD96] dark:border-[#EDBD96]/50 bg-[#EDBD96]/5 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Image
          src="/images/tamara.svg"
          alt="Tamara"
          width={90}
          height={24}
          className="h-6 w-auto"
        />
        {instalments > 0 && (
          <p className="text-sm font-semibold text-dark dark:text-gray-100">
            {t("payment.tamaraInstalment", {
              count: instalments.toLocaleString(`${locale}-u-nu-latn`),
            })}
          </p>
        )}
      </div>

      {instalments > 0 && (
        <div className="mb-4 flex items-baseline justify-between rounded-lg bg-white/70 dark:bg-dark/60 px-4 py-3">
          <span className="text-sm text-gray-text">
            {t("payment.tamaraPerPayment")}
          </span>
          <span
            dir="ltr"
            className="text-lg font-bold text-dark dark:text-gray-100"
          >
            <SarIcon /> {formatAmount(perInstalment, locale)}
          </span>
        </div>
      )}

      <p className="mb-4 text-xs leading-relaxed text-gray-text">
        {t("payment.tamaraRedirectNote")}
      </p>

      <button
        type="button"
        onClick={onContinue}
        disabled={redirecting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70"
      >
        {redirecting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {t("payment.redirectingToTamara")}
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            {t("payment.continueToTamara")}
          </>
        )}
      </button>

      <div className="mt-3 flex items-start gap-2 text-xs text-gray-text">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>{t("payment.tamaraSecurityNote")}</p>
      </div>
    </div>
  );
}
