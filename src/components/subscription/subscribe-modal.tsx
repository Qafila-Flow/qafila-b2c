"use client";

import { useState, useEffect, useRef } from "react";
import { X, CreditCard, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import { subscribe, changePlan } from "@/lib/api/subscriptions";
import { useSubscription } from "@/lib/subscription-context";
import type { SubscriptionPlan } from "@/lib/api/plans";
import type { BillingCycle } from "@/lib/api/subscriptions";
import { useLocale } from "next-intl";

interface SubscribeModalProps {
  plan: SubscriptionPlan | null;
  defaultBillingCycle?: "monthly" | "annually";
  onClose: () => void;
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function formatCard(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function formatCvv(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

type Step = "form" | "processing" | "success" | "error";

export function SubscribeModal({
  plan,
  defaultBillingCycle = "monthly",
  onClose,
}: SubscribeModalProps) {
  const locale = useLocale();
  const { subscription, refreshSubscription } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    defaultBillingCycle,
  );
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!plan) return null;

  const isFree = plan.priceMonthly === 0;
  const price = billingCycle === "annually" ? plan.priceAnnually : plan.priceMonthly;
  const planName = locale === "ar" ? plan.nameAr : plan.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    setErrorMsg("");

    // Simulate a brief payment processing delay
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const backendCycle: BillingCycle = isFree
        ? "FREE"
        : billingCycle === "annually"
          ? "ANNUALLY"
          : "MONTHLY";

      // If the user already has a subscription use change-plan, otherwise subscribe
      if (subscription) {
        await changePlan({ newPlanId: plan.id, billingCycle: backendCycle });
      } else {
        await subscribe({ planId: plan.id, billingCycle: backendCycle });
      }
      await refreshSubscription();
      setStep("success");
    } catch (err: any) {
      setErrorMsg(
        err?.message ?? "Subscription failed. Please try again.",
      );
      setStep("error");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl overflow-hidden">
        {/* ── Success state ───────────────────────────────────── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <CheckCircle2 size={56} className="text-green" />
            <h2 className="text-xl font-bold text-dark dark:text-gray-100">
              You&apos;re now subscribed!
            </h2>
            <p className="text-sm text-gray-text">
              Welcome to <span className="font-semibold">{planName}</span>. Your
              subscription is active and you can start using all features right
              away.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {/* ── Error state ─────────────────────────────────────── */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <AlertCircle size={56} className="text-discount" />
            <h2 className="text-xl font-bold text-dark dark:text-gray-100">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-text">{errorMsg}</p>
            <div className="mt-2 flex w-full gap-3">
              <button
                onClick={() => setStep("form")}
                className="flex-1 rounded-xl border border-gray-border py-3 text-sm font-semibold text-dark hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-dark py-3 text-sm font-semibold text-white hover:bg-dark/90"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Processing overlay ──────────────────────────────── */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            <p className="text-sm font-medium text-gray-text">
              Processing payment…
            </p>
          </div>
        )}

        {/* ── Main form ───────────────────────────────────────── */}
        {step === "form" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-border dark:border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-dark dark:text-gray-100">
                  Subscribe to {planName}
                </h2>
                <p className="mt-0.5 text-xs text-gray-text">
                  {isFree ? "Free — no credit card required" : "Secure checkout"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-text hover:text-dark dark:hover:text-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Plan summary */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-text">Plan</p>
                    <p className="font-semibold text-dark dark:text-gray-100">{planName}</p>
                  </div>
                  <div className="text-right" dir="ltr">
                    {isFree ? (
                      <span className="text-lg font-bold text-dark dark:text-gray-100">
                        Free
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-dark dark:text-gray-100">
                        <SarIcon /> {price?.toLocaleString()}
                        <span className="text-xs font-normal text-gray-text">
                          /{billingCycle === "annually" ? "yr" : "mo"}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Billing cycle toggle — only for paid plans */}
                {!isFree && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-border dark:border-gray-700 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`flex-1 py-2 font-medium transition-colors ${
                        billingCycle === "monthly"
                          ? "bg-primary text-white"
                          : "text-gray-text hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annually")}
                      className={`flex-1 py-2 font-medium transition-colors ${
                        billingCycle === "annually"
                          ? "bg-primary text-white"
                          : "text-gray-text hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      Annual
                      {plan.priceAnnually < plan.priceMonthly * 12 && (
                        <span className="ms-1 rounded bg-green/20 px-1 text-green text-[10px]">
                          SAVE
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Mock payment form — only for paid plans */}
              {!isFree && (
                <div className="space-y-4">
                  {/* Test mode banner */}
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-3 py-2">
                    <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      TEST
                    </span>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Use card <span className="font-mono font-semibold">4242 4242 4242 4242</span> for testing
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} className="text-gray-text" />
                    <span className="text-xs font-semibold text-dark dark:text-gray-100 uppercase tracking-wide">
                      Payment Details
                    </span>
                  </div>

                  {/* Card number */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-text">
                      Card Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCard(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm font-mono text-dark dark:text-gray-100 outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-text">
                        Expiry
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        required
                        className="w-full rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm font-mono text-dark dark:text-gray-100 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-text">
                        CVV
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => setCvv(formatCvv(e.target.value))}
                        placeholder="123"
                        required
                        className="w-full rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm font-mono text-dark dark:text-gray-100 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Cardholder name */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-text">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name on card"
                      required
                      className="w-full rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm text-dark dark:text-gray-100 outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <Lock size={14} />
                {isFree
                  ? "Start for Free"
                  : `Pay ${plan.currency} ${price?.toLocaleString()}`}
              </button>

              {/* Security note */}
              {!isFree && (
                <p className="text-center text-[11px] text-gray-text">
                  <Lock size={10} className="inline me-1" />
                  Payments are encrypted and secure
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
