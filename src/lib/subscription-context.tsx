"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { getMySubscription, getMyUsage } from "./api/subscriptions";
import type { Subscription, UsageSummary } from "./api/subscriptions";

interface SubscriptionContextValue {
  subscription: Subscription | null;
  usage: UsageSummary[];
  isLoading: boolean;
  /** True when the user has an active, paid (non-free) subscription. */
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
  /** Returns true if the feature boolean is enabled or limit > 0 (or -1 = unlimited) */
  hasFeature: (featureKey: string) => boolean;
  /** Returns the usage entry for a specific feature key, or null */
  getUsageFor: (featureKey: string) => UsageSummary | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const [sub, usageData] = await Promise.all([
        getMySubscription(),
        getMyUsage().catch(() => [] as UsageSummary[]),
      ]);
      setSubscription(sub);
      setUsage(usageData);
    } catch {
      // If unauthenticated or any error, clear state
      setSubscription(null);
      setUsage([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setUsage([]);
    }
  }, [isLoggedIn, fetchSubscription]);

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      if (!subscription?.plan?.features) return false;
      const features = subscription.plan.features as Record<string, unknown>;
      const value = features[featureKey];
      if (value === undefined || value === null) return false;
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value !== 0; // -1 = unlimited, N > 0 = limited, 0 = disabled
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    },
    [subscription],
  );

  const getUsageFor = useCallback(
    (featureKey: string): UsageSummary | null => {
      return usage.find((u) => u.featureKey === featureKey) ?? null;
    },
    [usage],
  );

  // A user is "premium" when they hold a (non-cancelled/expired) subscription
  // to a PAID plan. We check several signals because the API may return prices
  // as strings, omit them, or leave `billingCycle` at its DB default of FREE
  // even on a paid plan. The free tier is "Basic" (priceMonthly null / tier
  // "Basic"); any other tier or a positive price counts as paid.
  const plan = subscription?.plan;
  const tier = String(plan?.tier ?? "")
    .trim()
    .toLowerCase();
  const isPaidPlan = Boolean(
    Number(plan?.priceMonthly ?? 0) > 0 ||
      Number(plan?.priceAnnually ?? 0) > 0 ||
      subscription?.billingCycle === "MONTHLY" ||
      subscription?.billingCycle === "ANNUALLY" ||
      (tier !== "" && tier !== "basic" && tier !== "free"),
  );
  const status = subscription?.status;
  const isPremium = Boolean(
    subscription && status !== "CANCELLED" && status !== "EXPIRED" && isPaidPlan,
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        isLoading,
        isPremium,
        refreshSubscription: fetchSubscription,
        hasFeature,
        getUsageFor,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription must be used inside <SubscriptionProvider>",
    );
  }
  return ctx;
}
