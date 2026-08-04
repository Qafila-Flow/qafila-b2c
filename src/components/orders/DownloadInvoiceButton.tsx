"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { saveInvoice } from "@/lib/api/invoices";

interface DownloadInvoiceButtonProps {
  orderId: string;
  orderNumber: string;
  /** `solid` for the post-checkout call to action, `outline` inside order detail. */
  variant?: "solid" | "outline";
  className?: string;
}

export default function DownloadInvoiceButton({
  orderId,
  orderNumber,
  variant = "outline",
  className = "",
}: DownloadInvoiceButtonProps) {
  const t = useTranslations("invoice");
  // The PDF is rendered in whichever language the customer is browsing in.
  const locale = useLocale();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await saveInvoice(orderId, orderNumber, locale);
    } catch {
      setError(t("failed"));
    } finally {
      setLoading(false);
    }
  };

  const base =
    "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60";
  const skin =
    variant === "solid"
      ? "bg-primary text-white hover:bg-primary-hover"
      : "border-2 border-dark dark:border-gray-400 text-dark dark:text-gray-200 hover:bg-dark hover:text-white dark:hover:bg-gray-200 dark:hover:text-dark";

  return (
    <div className={className}>
      <button onClick={handleClick} disabled={loading} className={`${base} ${skin}`}>
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {loading ? t("preparing") : t("download")}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-discount">{error}</p>
      )}
    </div>
  );
}
