"use client";

import { Check, X, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SubscriptionPlan } from "@/lib/api/plans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  locale: string;
  billingCycle: "monthly" | "annually";
  isCurrentPlan?: boolean;
}

function renderFeatureValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <X size={14} className="text-gray-300" />;
  if (typeof value === "boolean") {
    return value ? (
      <Check size={14} className="text-green-500" />
    ) : (
      <X size={14} className="text-gray-300" />
    );
  }
  if (typeof value === "number") {
    if (value === 0) return <X size={14} className="text-gray-300" />;
    if (value === -1) return <span className="text-xs font-medium text-green-600">Unlimited</span>;
    return <span className="text-xs font-medium">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <X size={14} className="text-gray-300" />;
    return <span className="text-xs">{(value as string[]).join(", ")}</span>;
  }
  return <Minus size={14} className="text-gray-300" />;
}

export function PricingCard({ plan, locale, billingCycle, isCurrentPlan }: PricingCardProps) {
  const planName = locale === "ar" ? plan.nameAr : plan.name;
  const price = billingCycle === "annually" ? plan.priceAnnually : plan.priceMonthly;
  const isFree = price === 0;
  const features = plan.features as Record<string, unknown>;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        isCurrentPlan
          ? "border-primary shadow-lg"
          : "border-gray-border dark:border-gray-700"
      }`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-dark dark:text-gray-100">{planName}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          {isFree ? (
            <span className="text-3xl font-bold text-dark dark:text-gray-100">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-dark dark:text-gray-100">{price}</span>
              <span className="text-sm text-gray-text">
                {plan.currency} / {billingCycle === "annually" ? "yr" : "mo"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Feature list */}
      <ul className="flex-1 space-y-3 mb-6">
        {Object.entries(features).map(([key, val]) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span className="shrink-0">{renderFeatureValue(val)}</span>
            <span className="text-gray-text capitalize">{key.replace(/([A-Z])/g, " $1").replace(/\./g, " › ")}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentPlan ? (
        <span className="block text-center rounded-xl border border-primary bg-primary/5 py-2.5 text-sm font-medium text-primary">
          Current Plan
        </span>
      ) : (
        <Link
          href="/pricing#contact"
          className="block text-center rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          {isFree ? "Get Started" : "Contact Us"}
        </Link>
      )}
    </div>
  );
}
