"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { InitiatedPayment, PaymentConfig } from "@/lib/api/payments";
import { attachProviderPayment } from "@/lib/api/payments";

/**
 * The provider's hosted card form.
 *
 * The card number, expiry and CVC are rendered by the provider's own script and
 * posted directly to the provider with the publishable key — they never touch a
 * Qafila server or this React tree. That is deliberate: collecting card data
 * ourselves would pull the whole platform into PCI DSS SAQ-D scope.
 *
 * The assets are pinned to an exact version with subresource integrity. This
 * script handles card data, so a floating version tag would mean silently
 * trusting whatever a CDN serves tomorrow.
 */

const MOYASAR_VERSION = "2.2.9";
const CSS_URL = `https://cdn.jsdelivr.net/npm/moyasar-payment-form@${MOYASAR_VERSION}/dist/moyasar.css`;
const JS_URL = `https://cdn.jsdelivr.net/npm/moyasar-payment-form@${MOYASAR_VERSION}/dist/moyasar.umd.min.js`;
const CSS_INTEGRITY =
  "sha384-NFVtuTtfB0hID6sml4OdF2e7RMKo53g/M0T6imjz7HPBz387tyUpfULOK/YSUJVD";
const JS_INTEGRITY =
  "sha384-yBbDmOhc1NTgtQev3ROuvjuZ+8RfM+PU0npl558aHg5Ax2VgrCK3Ia6TprcRylQo";

interface MoyasarGlobal {
  init: (options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Moyasar?: MoyasarGlobal;
  }
}

let assetsPromise: Promise<void> | null = null;

/** Load the provider assets once per page, however many times we mount. */
function loadMoyasarAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Moyasar) return Promise.resolve();
  if (assetsPromise) return assetsPromise;

  assetsPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.integrity = CSS_INTEGRITY;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${JS_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load the payment form")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = JS_URL;
    script.integrity = JS_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      assetsPromise = null;
      reject(new Error("Failed to load the payment form"));
    };
    document.head.appendChild(script);
  });

  return assetsPromise;
}

interface MoyasarFormProps {
  intent: InitiatedPayment;
  config: PaymentConfig;
  /** Surfaced to the page so it can render its own error state. */
  onError?: (message: string) => void;
}

export default function MoyasarForm({
  intent,
  config,
  onError,
}: MoyasarFormProps) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // React 18 mounts effects twice in development. Initialising the form twice
    // renders two sets of card inputs, so latch it.
    if (initializedRef.current) return;

    loadMoyasarAssets()
      .then(() => {
        if (cancelled || initializedRef.current) return;
        if (!window.Moyasar) {
          throw new Error("Payment form did not load");
        }

        initializedRef.current = true;

        window.Moyasar.init({
          element: ".mysr-form",
          // Straight from the server. Recomputing the amount in the browser is
          // how a rounding difference turns into a failed payment.
          amount: intent.amountMinor,
          currency: intent.currency,
          description: intent.description,
          publishable_api_key: config.publishableKey,
          callback_url: intent.callbackUrl,
          methods: config.methods,
          supported_networks: config.supportedNetworks,
          language: locale === "ar" ? "ar" : "en",
          metadata: intent.metadata,
          // Only present when the API says Apple Pay is enabled, which in turn
          // requires the domain to be verified with the provider.
          ...(config.applePay
            ? {
                apple_pay: {
                  country: config.applePay.country,
                  label: config.applePay.label,
                  validate_merchant_url: config.applePay.validateMerchantUrl,
                },
              }
            : {}),
          on_completed: async (payment: { id?: string }) => {
            // Runs before the 3DS redirect. If the customer abandons the bank
            // challenge, this is the only record linking their attempt to us.
            if (!payment?.id) return;
            try {
              await attachProviderPayment(intent.paymentId, payment.id);
            } catch {
              // Never block the redirect on our own bookkeeping — the callback
              // carries the id too, and the reconcile job is the final net.
            }
          },
        });

        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Failed to load the payment form";
        setLoadError(message);
        setLoading(false);
        onError?.(message);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the payment only: re-running this for a new locale
    // would tear down a form the customer may already be typing into.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent.paymentId]);

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      {loading && !loadError && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary" />
        </div>
      )}

      {loadError && (
        <div className="rounded-lg bg-discount/10 p-4 text-sm text-discount">
          {loadError}
        </div>
      )}

      <div ref={containerRef} className="mysr-form" />
    </div>
  );
}
