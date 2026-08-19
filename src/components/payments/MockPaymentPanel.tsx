"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import type { InitiatedPayment } from "@/lib/api/payments";
import { attachProviderPayment } from "@/lib/api/payments";

/**
 * Development stand-in for the provider's hosted card form.
 *
 * The API exposes a mock provider (PAYMENTS_PROVIDER=mock) so the whole
 * checkout can be exercised without gateway keys, but a mock provider has no
 * card form to render. This panel fills that gap — and it does it by driving
 * the *real* callback endpoint rather than a shortcut, so what gets tested
 * locally is the same path production uses: attach the provider payment id,
 * then hand the browser to /v1/payments/callback exactly as the provider would.
 *
 * It only renders when the API reports provider "mock". With real keys
 * configured, the customer sees the provider's form and never this.
 */

interface MockPaymentPanelProps {
  intent: InitiatedPayment;
  onError?: (message: string) => void;
}

export default function MockPaymentPanel({
  intent,
  onError,
}: MockPaymentPanelProps) {
  const [busy, setBusy] = useState(false);

  const simulate = async (outcome: "paid" | "failed") => {
    setBusy(true);
    try {
      // Matches the mock provider's id convention on the API side.
      const providerPaymentId =
        outcome === "failed"
          ? `mock_${intent.paymentId}_fail`
          : `mock_${intent.paymentId}`;

      await attachProviderPayment(intent.paymentId, providerPaymentId);

      // Same redirect the real provider performs, so the callback, the
      // finalisation and the return-url handling are all genuinely exercised.
      const callback = new URL(intent.callbackUrl);
      callback.searchParams.set("id", providerPaymentId);
      callback.searchParams.set("status", outcome);
      window.location.href = callback.toString();
    } catch (e) {
      setBusy(false);
      onError?.(
        e instanceof Error ? e.message : "Could not simulate the payment",
      );
    }
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Development mode
        </span>
      </div>
      <p className="mb-4 text-xs text-amber-700 dark:text-amber-400">
        No payment gateway is configured, so no card form is shown and no money
        moves. Choose an outcome to exercise the real callback flow.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void simulate("paid")}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          Simulate successful payment
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void simulate("failed")}
          className="rounded-full border border-gray-border px-5 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-white/60 disabled:opacity-50 dark:border-gray-700 dark:text-gray-100"
        >
          Simulate declined card
        </button>
      </div>
    </div>
  );
}
