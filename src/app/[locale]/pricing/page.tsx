"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useLocale } from "next-intl";
import { getPlans } from "@/lib/api/plans";
import { useSubscription } from "@/lib/subscription-context";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  ChevronDown,
  Minus,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Crown,
  Mail,
} from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import type { SubscriptionPlan, PlanSegment } from "@/lib/api/plans";
import { SubscribeModal } from "@/components/subscription/subscribe-modal";
import LoginModal from "@/components/auth/LoginModal";

// ── Static config ────────────────────────────────────────────────────────────
const FEATURE_GROUPS: Record<string, { label: string; labelAr: string }> = {
  reviews: { label: "Reviews & Ratings", labelAr: "التقييمات والمراجعات" },
  statistics: { label: "Statistics Insights", labelAr: "رؤى إحصائية" },
  aiResearch: { label: "AI Research", labelAr: "البحث بالذكاء الاصطناعي" },
  reports: { label: "Reports & Exports", labelAr: "التقارير والتصدير" },
  licenses: { label: "Licenses & Sharing", labelAr: "التراخيص والمشاركة" },
};

const SEGMENT_CONFIG: Record<PlanSegment, { label: string; labelAr: string }> = {
  INDIVIDUAL: { label: "Individual", labelAr: "أفراد" },
  BUSINESS: { label: "Business", labelAr: "أعمال" },
  GOVERNMENT: { label: "Government", labelAr: "حكومي" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function featureLabel(key: string, locale: string): string {
  const name = key.split(".").slice(-1)[0] ?? key;
  const human = name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
  // Light Arabic mapping for the most-common keys; falls back to English wording.
  if (locale !== "ar") return human;
  const dict: Record<string, string> = {
    "Daily Query Limit": "الحد اليومي للاستفسارات",
    "Monthly Reports": "التقارير الشهرية",
    "Export As Pdf": "تصدير PDF",
    "Export As Excel": "تصدير Excel",
    "Team Seats": "مقاعد الفريق",
    "Premium Support": "دعم متميز",
    "Saved Searches": "عمليات بحث محفوظة",
    "Watchlist": "قائمة المراقبة",
    "Custom Reports": "تقارير مخصصة",
  };
  return dict[human] ?? human;
}

function groupKey(key: string): string {
  return key.split(".")[0] ?? "other";
}

function groupFeatureKeys(plans: SubscriptionPlan[]): Record<string, string[]> {
  const allKeys = Array.from(
    new Set(
      plans.flatMap((p) => Object.keys(p.features as Record<string, unknown>)),
    ),
  );
  const groups: Record<string, string[]> = {};
  for (const key of allKeys) {
    const g = groupKey(key);
    if (!groups[g]) groups[g] = [];
    groups[g].push(key);
  }
  return groups;
}

function planHighlights(
  plan: SubscriptionPlan,
  locale: string,
  max = 6,
): string[] {
  const features = plan.features as Record<string, unknown>;
  const highlights: string[] = [];
  for (const [key, val] of Object.entries(features)) {
    if (highlights.length >= max) break;
    let included = false;
    if (typeof val === "boolean") included = val;
    else if (typeof val === "number") included = val !== 0;
    else if (Array.isArray(val)) included = val.length > 0;
    if (included) highlights.push(featureLabel(key, locale));
  }
  return highlights;
}

// ── Cell renderer for the comparison table ───────────────────────────────────
function CellValue({ value, locale }: { value: unknown; locale: string }) {
  if (value === null || value === undefined)
    return <Minus size={14} className="mx-auto text-gray-300 dark:text-gray-700" />;

  if (typeof value === "boolean") {
    return value ? (
      <span className="mx-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-green/10 text-green ring-1 ring-green/30">
        <Check size={13} strokeWidth={3} />
      </span>
    ) : (
      <Minus size={15} className="mx-auto text-gray-300 dark:text-gray-700" />
    );
  }

  if (typeof value === "number") {
    if (value === 0)
      return <Minus size={15} className="mx-auto text-gray-300 dark:text-gray-700" />;
    if (value === -1)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-green ring-1 ring-green/30">
          <Sparkles size={10} />
          {locale === "ar" ? "غير محدود" : "Unlimited"}
        </span>
      );
    return (
      <span className="text-sm font-bold text-dark dark:text-gray-100">
        {value.toLocaleString()}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0)
      return <Minus size={15} className="mx-auto text-gray-300 dark:text-gray-700" />;
    return (
      <span className="text-xs text-dark dark:text-gray-200 leading-tight">
        {(value as string[]).join(" / ")}
      </span>
    );
  }

  return (
    <span className="text-xs text-dark dark:text-gray-200">{String(value)}</span>
  );
}

// ── Mouse-tracked spotlight wrapper ──────────────────────────────────────────
function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r || !ref.current) return;
        ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`spotlight relative ${className}`}
    >
      {children}
    </div>
  );
}

// ── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  locale,
  billingCycle,
  isCurrentPlan,
  isFeatured,
  index,
  onSubscribe,
}: {
  plan: SubscriptionPlan;
  locale: string;
  billingCycle: "monthly" | "annually";
  isCurrentPlan: boolean;
  isFeatured: boolean;
  index: number;
  onSubscribe: (plan: SubscriptionPlan) => void;
}) {
  const planName = locale === "ar" ? plan.nameAr : plan.name;
  const price =
    billingCycle === "annually"
      ? plan.priceAnnually || 0
      : plan.priceMonthly || 0;
  const isFree = plan.priceMonthly === 0;
  const highlights = planHighlights(plan, locale, 6);

  const monthly = plan.priceMonthly || 0;
  const annual = plan.priceAnnually || 0;
  const yearlySavings =
    monthly > 0 && annual > 0
      ? Math.max(0, Math.round((1 - annual / (monthly * 12)) * 100))
      : 0;

  const t = {
    mostPopular: locale === "ar" ? "الأكثر شيوعاً" : "Most Popular",
    currentPlan: locale === "ar" ? "خطتك الحالية" : "Current Plan",
    perMonth: locale === "ar" ? "/ شهرياً" : "/ month",
    billedAnnually:
      locale === "ar" ? "تُحاسب سنوياً" : "billed annually",
    startFree: locale === "ar" ? "ابدأ مجاناً" : "Start for free",
    choosePlan: locale === "ar" ? "اختر هذه الخطة" : "Choose this plan",
    includes: locale === "ar" ? "ما تشمله الخطة" : "What's included",
    save: locale === "ar" ? "وفّر" : "Save",
  };

  return (
    <div
      className="fade-rise relative"
      style={{ animationDelay: `${120 + index * 110}ms` }}
    >
      {/* Featured glow halo */}
      {isFeatured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[28px] blur-2xl opacity-60 dark:opacity-80"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(232,152,58,0.45), transparent 70%)",
          }}
        />
      )}

      {/* Animated conic border for featured card */}
      {isFeatured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px overflow-hidden rounded-3xl"
        >
          <div className="featured-conic absolute -inset-[100%]" />
        </div>
      )}

      <Spotlight
        className={`flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-500 ${
          isFeatured
            ? "bg-white dark:bg-[#161616] shadow-2xl shadow-primary/20 dark:shadow-primary/10 scale-[1.02]"
            : "bg-white/80 dark:bg-[#141414]/80 backdrop-blur-sm border border-gray-border dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
        }`}
      >
        <div className="relative flex h-full flex-col px-7 pt-8 pb-7">
          {/* Top row: badge + tier dot */}
          <div className="flex items-center justify-between">
            {isFeatured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary-hover px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-primary/40">
                <Crown size={11} strokeWidth={2.5} />
                {t.mostPopular}
              </span>
            ) : isCurrentPlan ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-green ring-1 ring-green/30">
                <Check size={11} strokeWidth={2.5} />
                {t.currentPlan}
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-text dark:text-gray-500">
                {SEGMENT_CONFIG[plan.segment][
                  locale === "ar" ? "labelAr" : "label"
                ]}
              </span>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i < Math.min(3, Math.max(1, plan.tier))
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Plan name */}
          <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-dark dark:text-white">
            {planName}
          </h3>

          {/* Price block (re-keyed on cycle change to retrigger pop animation) */}
          <div
            key={`${plan.id}-${billingCycle}`}
            className="mt-4 min-h-[78px]"
            style={{ animation: "price-pop 420ms cubic-bezier(0.22,1,0.36,1)" }}
          >
            {isFree ? (
              <div className="flex items-baseline gap-1.5" dir="ltr">
                <span className="text-5xl font-black tracking-tight text-dark dark:text-white">
                  Free
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1" dir="ltr">
                  <SarIcon className="text-2xl text-dark dark:text-white" />
                  <span className="text-5xl font-black tracking-tight text-dark dark:text-white">
                    {price.toLocaleString()}
                  </span>
                  <span className="ms-1 text-sm font-medium text-gray-text dark:text-gray-400">
                    {t.perMonth}
                  </span>
                </div>
                {billingCycle === "annually" && yearlySavings > 0 && (
                  <p className="mt-1.5 text-xs text-gray-text dark:text-gray-400">
                    {t.billedAnnually}
                    <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green ring-1 ring-green/20">
                      {t.save} {yearlySavings}%
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6">
            {isCurrentPlan ? (
              <span className="flex h-12 w-full items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary/5 text-sm font-bold text-primary dark:bg-primary/10">
                <Check size={15} className="me-2" strokeWidth={2.5} />
                {t.currentPlan}
              </span>
            ) : (
              <button
                onClick={() => onSubscribe(plan)}
                className={`group/btn relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isFeatured
                    ? "bg-dark text-white shadow-lg shadow-dark/30 hover:shadow-xl hover:shadow-primary/30 dark:bg-white dark:text-dark"
                    : "border border-gray-border bg-gray-light text-dark hover:border-primary hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary dark:hover:border-primary"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isFree ? t.startFree : t.choosePlan}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 rtl:rotate-180"
                  />
                </span>
                {isFeatured && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full"
                  />
                )}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mt-7 mb-5 h-px bg-gradient-to-r from-transparent via-gray-border to-transparent dark:via-white/10" />

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="flex-1">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-text dark:text-gray-500">
                {t.includes}
              </p>
              <ul className="space-y-3">
                {highlights.map((label, i) => (
                  <li
                    key={label}
                    className="fade-rise flex items-start gap-3 text-sm text-dark dark:text-gray-200"
                    style={{ animationDelay: `${300 + index * 110 + i * 60}ms` }}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isFeatured
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span className="leading-snug">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Spotlight>
    </div>
  );
}

// ── FAQ item ─────────────────────────────────────────────────────────────────
function FAQItem({
  q,
  a,
  defaultOpen = false,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        open
          ? "border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.07]"
          : "border-gray-border bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className="text-sm font-bold text-dark dark:text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-text transition-transform duration-300 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-400 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-gray-text dark:text-gray-400">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { isLoggedIn } = useAuth();
  const { subscription } = useSubscription();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    "monthly",
  );
  const [activeSegment, setActiveSegment] = useState<PlanSegment | "ALL">(
    "ALL",
  );
  const [subscribingPlan, setSubscribingPlan] =
    useState<SubscriptionPlan | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const tableRef = useRef<HTMLDivElement>(null);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (!isLoggedIn) {
      setSubscribingPlan(plan);
      setLoginModalOpen(true);
    } else {
      setSubscribingPlan(plan);
    }
  };

  const handleLoginClose = () => {
    setLoginModalOpen(false);
    if (!isLoggedIn) setSubscribingPlan(null);
  };

  useEffect(() => {
    getPlans({ isActive: true, limit: 50 })
      .then((res) =>
        setPlans(res.data.filter((p) => p.segment !== "GOVERNMENT")),
      )
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const availableSegments = Array.from(
    new Set(plans.map((p) => p.segment)),
  ) as PlanSegment[];

  const filteredPlans =
    activeSegment === "ALL"
      ? plans
      : plans.filter((p) => p.segment === activeSegment);
  const sortedPlans = [...filteredPlans].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const featuredPlan = useMemo<SubscriptionPlan | null>(
    () =>
      sortedPlans.reduce<SubscriptionPlan | null>((best, p) => {
        if (p.priceMonthly === 0) return best;
        if (!best) return p;
        return p.tier > best.tier ? p : best;
      }, null),
    [sortedPlans],
  );

  // Groups default to open. `openGroups[name]` is only stored when the user
  // explicitly collapses or re-opens a group, so the `!== false` check below
  // handles the "open by default" case without an initialization effect.
  const featureGroups = groupFeatureKeys(sortedPlans);
  const groupOrder = [
    "reviews",
    "statistics",
    "aiResearch",
    "reports",
    "licenses",
  ];
  const orderedGroups = [
    ...groupOrder.filter((g) => featureGroups[g]),
    ...Object.keys(featureGroups).filter((g) => !groupOrder.includes(g)),
  ];

  // ── i18n strings ───────────────────────────────────────────────────────────
  const T = {
    eyebrow: isAr ? "خطط مميزة" : "Premium Plans",
    title1: isAr ? "بيانات معتمدة من خبراء" : "Expert-verified market data",
    title2: isAr ? "لكل قرار تتخذه" : "for every decision",
    subtitle: isAr
      ? "من الإحصائيات المجانية إلى التغطية الكاملة للأسواق، اختر الخطة التي تناسب احتياجاتك البحثية."
      : "From free stats to full market coverage — pick the plan that fits how you research, scale and decide.",
    forIndividual: isAr ? "للأفراد والباحثين" : "For individuals & researchers",
    forBusiness: isAr ? "للشركات والوكالات" : "For teams, businesses & agencies",
    forGovernment: isAr ? "للجهات الحكومية" : "For government entities",
    all: isAr ? "كل الخطط" : "All plans",
    monthly: isAr ? "شهرياً" : "Monthly",
    annual: isAr ? "سنوياً" : "Annual",
    save2Months: isAr ? "خصم 17%" : "Save up to 17%",
    compareTitle: isAr ? "قارن الخطط بالتفصيل" : "Compare every detail",
    compareSub: isAr
      ? "كل ميزة في كل خطة. اضغط على المجموعة لتوسيعها أو طيّها."
      : "Every feature across every plan. Click any group to fold or unfold it.",
    plansHeading: isAr
      ? "خطة لكل مرحلة من رحلتك"
      : "A plan for every stage of your journey",
    plansSub: isAr
      ? "ابدأ مجاناً واترقَّ متى احتجت — لا تقييد، لا التزام طويل."
      : "Start free and upgrade when you need to — no lock-in, cancel anytime.",
    compareLink: isAr ? "مقارنة كاملة للميزات" : "Compare all features",
    faqHeading: isAr ? "أسئلة شائعة" : "Frequently asked",
    faqSub: isAr
      ? "كل ما تحتاج معرفته قبل البدء."
      : "Everything you need before you start.",
    customCtaTitle: isAr
      ? "تحتاج خطة مخصصة؟"
      : "Need something custom?",
    customCtaSub: isAr
      ? "تواصل مع فريقنا للحصول على أسعار للمؤسسات، تراخيص جماعية، أو أي استفسار."
      : "Talk to our team about enterprise pricing, bulk licenses, or anything you'd like to ask.",
    contact: isAr ? "تواصل معنا" : "Contact us",
    trust1Title: isAr ? "بيانات إحصائية" : "Statistics intelligence",
    trust1Sub: isAr
      ? "تقارير وأرقام من أكبر بنوك البيانات في العالم."
      : "Reports and figures from the world's leading data bank.",
    trust2Title: isAr ? "بحث بالذكاء الاصطناعي" : "AI research, instant",
    trust2Sub: isAr
      ? "اطرح السؤال — تحصل على إجابة موثقة بالمصادر."
      : "Ask the question — get an answer backed by sources.",
    trust3Title: isAr ? "إلغاء في أي وقت" : "Cancel anytime",
    trust3Sub: isAr
      ? "بلا التزامات طويلة، بلا رسوم خفية."
      : "No long-term lock-in, no hidden fees.",
    features: isAr ? "الميزات" : "Features",
    free: isAr ? "مجاني" : "Free",
    current: isAr ? "الحالية" : "Current",
    perMo: isAr ? "/ شهر" : "/ mo",
    startFree: isAr ? "ابدأ مجاناً" : "Start free",
    selectPlan: isAr ? "اختر الخطة" : "Select plan",
  };

  const faqs = isAr
    ? [
        {
          q: "هل يمكنني تغيير خطتي في أي وقت؟",
          a: "نعم. يمكنك الترقية أو التخفيض في أي وقت، وسنحسب الفروق تناسبياً.",
        },
        {
          q: "هل تتوفر فترة تجريبية؟",
          a: "خطة Free تتيح لك تجربة المنصة دون أي بطاقة. بعض الخطط المدفوعة تشمل فترة تجريبية — تواصل معنا للتفاصيل.",
        },
        {
          q: "ما طرق الدفع المقبولة؟",
          a: "نقبل بطاقات الائتمان الكبرى (فيزا، ماستركارد، مدى) ويمكن للحسابات المؤسسية الدفع عبر فاتورة.",
        },
        {
          q: "ما الفرق بين الفوترة الشهرية والسنوية؟",
          a: "الفوترة السنوية توفّر ما يصل إلى 17% مقارنة بالشهرية، بنفس الميزات تماماً.",
        },
      ]
    : [
        {
          q: "Can I change my plan at any time?",
          a: "Yes — upgrade or downgrade whenever you want. We prorate the difference automatically.",
        },
        {
          q: "Is there a free trial?",
          a: "The Free plan lets you explore the platform with no card required. Some paid plans include a trial period — reach out to learn more.",
        },
        {
          q: "Which payment methods do you accept?",
          a: "We accept major credit cards (Visa, Mastercard, mada). Business accounts can also pay by invoice.",
        },
        {
          q: "What's the difference between monthly and annual billing?",
          a: "Annual billing saves up to 17% compared to monthly, with identical features.",
        },
      ];

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0B0B0F]">
        {/* Grid backdrop */}
        <div
          aria-hidden
          className="bg-grid-soft pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_30%,transparent_75%)]"
        />
        {/* Aurora blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 start-1/4 h-[420px] w-[420px] rounded-full blur-[120px] opacity-60 dark:opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(232,152,58,0.7), transparent 60%)",
            animation: "aurora-drift-a 14s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 end-0 h-[380px] w-[380px] rounded-full blur-[110px] opacity-40 dark:opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(120,80,200,0.55), transparent 60%)",
            animation: "aurora-drift-b 18s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-72 start-0 h-[300px] w-[300px] rounded-full blur-[100px] opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(232,152,58,0.45), transparent 60%)",
            animation: "aurora-drift-c 22s ease-in-out infinite",
          }}
        />

        {/* ── Animated orbital arc constellation ─────────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full flex justify-center"
        >
          <svg
            viewBox="0 0 1200 760"
            preserveAspectRatio="xMidYMax meet"
            className="hero-arc-svg h-full w-full"
          >
            <defs>
              <linearGradient id="arcGradMain" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#7850c8" stopOpacity="0" />
                <stop offset="22%"  stopColor="#7850c8" stopOpacity="0.65" />
                <stop offset="50%"  stopColor="#e8983a" stopOpacity="1" />
                <stop offset="78%"  stopColor="#e8983a" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#7850c8" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="arcCoreGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#e8983a" stopOpacity="1" />
                <stop offset="55%"  stopColor="#e8983a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#e8983a" stopOpacity="0" />
              </radialGradient>
              <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <path id="arcOuter" d="M 60 760  A 560 560 0 0 1 1140 760" />
              <path id="arcMain"  d="M 140 760 A 480 480 0 0 1 1060 760" />
              <path id="arcInner" d="M 220 760 A 400 400 0 0 1 980 760" />
            </defs>

            {/* Radial tick marks fanning from the origin */}
            <g>
              {Array.from({ length: 13 }).map((_, i) => {
                const angle = (i - 6) * 7;
                return (
                  <line
                    key={i}
                    x1="600"
                    y1="722"
                    x2="600"
                    y2="696"
                    stroke="rgba(232,152,58,0.55)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${angle} 600 760)`}
                    className="arc-tick"
                    style={{ animationDelay: `${300 + i * 55}ms` }}
                  />
                );
              })}
            </g>

            {/* Outer faint purple orbit — slow reverse march */}
            <use
              href="#arcOuter"
              fill="none"
              stroke="rgba(120,80,200,0.5)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="2 14"
              className="arc-flow-slow"
            />

            {/* Main arc — gradient stroke that draws in on mount */}
            <use
              href="#arcMain"
              fill="none"
              stroke="url(#arcGradMain)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength="1"
              className="arc-main"
            />

            {/* Bright energy pulse flowing along the main arc */}
            <use
              href="#arcMain"
              fill="none"
              stroke="#e8983a"
              strokeOpacity="0.95"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="arc-flow-bright"
              filter="url(#arcGlow)"
            />

            {/* Inner arc — fast forward dashes */}
            <use
              href="#arcInner"
              fill="none"
              stroke="rgba(232,152,58,0.45)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="1 9"
              className="arc-flow-fast"
            />

            {/* Three orbiting glowing dots */}
            <g filter="url(#arcGlow)">
              <circle r="5" fill="#e8983a">
                <animate
                  attributeName="opacity"
                  values="0.45;1;0.45"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
                <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#arcMain" />
                </animateMotion>
              </circle>
              <circle r="3.5" fill="#7850c8">
                <animateMotion
                  dur="11s"
                  repeatCount="indefinite"
                  calcMode="linear"
                  keyPoints="1;0"
                  keyTimes="0;1"
                >
                  <mpath href="#arcOuter" />
                </animateMotion>
              </circle>
              <circle r="2.5" fill="#ffffff" opacity="0.95">
                <animateMotion dur="7s" repeatCount="indefinite" begin="-3s">
                  <mpath href="#arcInner" />
                </animateMotion>
              </circle>
            </g>

            {/* Origin core — radial glow that breathes */}
            <circle cx="600" cy="760" r="48" fill="url(#arcCoreGrad)">
              <animate attributeName="r" values="38;66;38" dur="3.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3.6s" repeatCount="indefinite" />
            </circle>

            {/* Expanding ping rings — radar-style outward ripples */}
            <circle cx="600" cy="760" fill="none" stroke="#e8983a" strokeWidth="1.5">
              <animate attributeName="r" values="18;140" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="760" fill="none" stroke="#7850c8" strokeWidth="1">
              <animate attributeName="r" values="18;120" dur="3s" begin="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Inner core dot */}
            <circle cx="600" cy="760" r="6" fill="#ffffff" opacity="0.95" filter="url(#arcGlow)" />
            <circle cx="600" cy="760" r="3.5" fill="#e8983a" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-12 lg:pt-28">
          {/* Eyebrow chip with shimmer */}
          <div className="mb-6 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-md dark:border-primary/40 dark:bg-white/5"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, rgba(232,152,58,0.18) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer-x 4s linear infinite",
              }}
            >
              <Sparkles size={12} strokeWidth={2.5} />
              {T.eyebrow}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-center text-4xl font-black leading-[1.05] tracking-tight text-dark dark:text-white sm:text-5xl lg:text-6xl">
            <span className="fade-rise inline-block" style={{ animationDelay: "60ms" }}>
              {T.title1}
            </span>
            <br />
            <span
              className="fade-rise inline-block bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent"
              style={{
                animationDelay: "160ms",
                backgroundSize: "200% 100%",
                animation:
                  "fade-rise 700ms cubic-bezier(0.22,1,0.36,1) forwards, shimmer-x 6s linear infinite",
              }}
            >
              {T.title2}
            </span>
          </h1>

          <p
            className="fade-rise mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-gray-text dark:text-gray-400 sm:text-lg"
            style={{ animationDelay: "260ms" }}
          >
            {T.subtitle}
          </p>

          {/* Segment + billing controls */}
          <div
            className="fade-rise mt-10 flex flex-col items-center gap-5"
            style={{ animationDelay: "360ms" }}
          >
            {/* Segment pill switcher */}
            {availableSegments.length > 1 && (
              <div className="inline-flex items-center gap-1 rounded-full border border-gray-border bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <SegmentButton
                  active={activeSegment === "ALL"}
                  onClick={() => setActiveSegment("ALL")}
                >
                  {T.all}
                </SegmentButton>
                {availableSegments.map((seg) => (
                  <SegmentButton
                    key={seg}
                    active={activeSegment === seg}
                    onClick={() => setActiveSegment(seg)}
                  >
                    {SEGMENT_CONFIG[seg][isAr ? "labelAr" : "label"]}
                  </SegmentButton>
                ))}
              </div>
            )}

            {/* Billing toggle */}
            <div className="relative inline-flex items-center gap-1 rounded-full border border-gray-border bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <span
                aria-hidden
                className={`absolute top-1 bottom-1 rounded-full bg-dark transition-all duration-300 ease-out dark:bg-white ${
                  billingCycle === "monthly"
                    ? "start-1 w-[88px]"
                    : "start-[92px] w-[124px]"
                }`}
              />
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 inline-flex h-9 w-[88px] items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  billingCycle === "monthly"
                    ? "text-white dark:text-dark"
                    : "text-gray-text dark:text-gray-400"
                }`}
              >
                {T.monthly}
              </button>
              <button
                onClick={() => setBillingCycle("annually")}
                className={`relative z-10 inline-flex h-9 w-[124px] items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors ${
                  billingCycle === "annually"
                    ? "text-white dark:text-dark"
                    : "text-gray-text dark:text-gray-400"
                }`}
              >
                {T.annual}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold transition-colors ${
                    billingCycle === "annually"
                      ? "bg-green text-white"
                      : "bg-green/10 text-green"
                  }`}
                >
                  -17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ──────────────────────────────────────────────── */}
      <section className="relative bg-[#FAF7F2] dark:bg-[#0B0B0F] pb-20">
        <div className="mx-auto max-w-6xl px-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="py-24 text-center text-gray-text dark:text-gray-500">
              {isAr ? "لا توجد خطط متاحة." : "No plans available."}
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                sortedPlans.length === 1
                  ? "max-w-md mx-auto"
                  : sortedPlans.length === 2
                    ? "md:grid-cols-2 max-w-3xl mx-auto"
                    : sortedPlans.length === 3
                      ? "md:grid-cols-3"
                      : "md:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {sortedPlans.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  locale={locale}
                  billingCycle={billingCycle}
                  isCurrentPlan={subscription?.planId === plan.id}
                  isFeatured={featuredPlan?.id === plan.id}
                  index={i}
                  onSubscribe={handlePlanSelect}
                />
              ))}
            </div>
          )}

          {/* Compare link */}
          {sortedPlans.length > 1 && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() =>
                  tableRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="group/cmp inline-flex items-center gap-2 rounded-full border border-gray-border bg-white px-6 py-3 text-sm font-bold text-dark transition-all hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-primary dark:hover:text-primary"
              >
                {T.compareLink}
                <ChevronDown
                  size={14}
                  className="transition-transform group-hover/cmp:translate-y-0.5"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────────── */}
      <section className="border-y border-gray-border bg-white dark:border-white/5 dark:bg-[#0F0F12]">
        <div className="mx-auto grid max-w-6xl gap-px bg-gray-border dark:bg-white/5 md:grid-cols-3">
          {[
            { icon: TrendingUp, title: T.trust1Title, sub: T.trust1Sub },
            { icon: Zap, title: T.trust2Title, sub: T.trust2Sub },
            { icon: Shield, title: T.trust3Title, sub: T.trust3Sub },
          ].map((item, i) => (
            <div
              key={i}
              className="group/trust flex items-start gap-4 bg-white p-7 transition-colors hover:bg-primary/[0.03] dark:bg-[#0F0F12] dark:hover:bg-primary/[0.05]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover/trust:scale-110 group-hover/trust:rotate-3">
                <item.icon size={20} strokeWidth={2.2} />
              </span>
              <div>
                <p className="font-bold text-dark dark:text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-gray-text dark:text-gray-400">
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ───────────────────────────────────────── */}
      {!loading && sortedPlans.length > 0 && (
        <section
          ref={tableRef}
          className="relative bg-[#FAF7F2] py-20 dark:bg-[#0B0B0F]"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-dark dark:text-white sm:text-4xl">
                {T.compareTitle}
              </h2>
              <p className="mt-3 text-base text-gray-text dark:text-gray-400">
                {T.compareSub}
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-gray-border bg-white shadow-sm dark:border-white/10 dark:bg-[#101013]">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th className="sticky start-0 z-10 w-56 bg-white px-6 py-6 text-start text-xs font-bold uppercase tracking-[0.16em] text-gray-text dark:bg-[#101013] dark:text-gray-500">
                        {T.features}
                      </th>
                      {sortedPlans.map((plan) => {
                        const price =
                          billingCycle === "annually"
                            ? plan.priceAnnually || 0
                            : plan.priceMonthly || 0;
                        const isFree = plan.priceMonthly === 0;
                        const isCurrent = subscription?.planId === plan.id;
                        const isFeat = featuredPlan?.id === plan.id;
                        return (
                          <th
                            key={plan.id}
                            className={`min-w-[160px] border-s border-gray-border px-4 py-6 text-center align-top dark:border-white/10 ${
                              isFeat
                                ? "bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/15"
                                : ""
                            }`}
                          >
                            {isFeat && (
                              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                <Crown size={9} strokeWidth={2.5} />
                                {isAr ? "موصى به" : "Popular"}
                              </span>
                            )}
                            <div
                              className={`text-base font-extrabold ${
                                isCurrent
                                  ? "text-primary"
                                  : "text-dark dark:text-white"
                              }`}
                            >
                              {isAr ? plan.nameAr : plan.name}
                            </div>
                            <div
                              className="mt-2 flex items-baseline justify-center gap-0.5"
                              dir="ltr"
                            >
                              {isFree ? (
                                <span className="text-2xl font-black text-dark dark:text-white">
                                  {T.free}
                                </span>
                              ) : (
                                <>
                                  <SarIcon className="text-base text-dark dark:text-white" />
                                  <span className="text-2xl font-black text-dark dark:text-white">
                                    {price?.toLocaleString()}
                                  </span>
                                  <span className="ms-0.5 text-[11px] text-gray-text dark:text-gray-500">
                                    {T.perMo}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-4">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
                                  <Check size={11} strokeWidth={3} />
                                  {T.current}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handlePlanSelect(plan)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${
                                    isFeat
                                      ? "bg-dark text-white hover:bg-primary dark:bg-white dark:text-dark dark:hover:bg-primary dark:hover:text-white"
                                      : "border border-gray-border text-dark hover:border-primary hover:text-primary dark:border-white/10 dark:text-gray-200 dark:hover:border-primary dark:hover:text-primary"
                                  }`}
                                >
                                  {isFree ? T.startFree : T.selectPlan}
                                  <ArrowRight
                                    size={11}
                                    className="rtl:rotate-180"
                                  />
                                </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {orderedGroups.map((groupName) => {
                      const keys = featureGroups[groupName] ?? [];
                      const groupCfg = FEATURE_GROUPS[groupName] ?? {
                        label:
                          groupName.charAt(0).toUpperCase() +
                          groupName.slice(1),
                        labelAr: groupName,
                      };
                      const isOpen = openGroups[groupName] !== false;
                      return [
                        <tr key={`group-${groupName}`}>
                          <td
                            colSpan={sortedPlans.length + 1}
                            className="border-t border-gray-border bg-gray-light/70 dark:border-white/10 dark:bg-white/[0.03]"
                          >
                            <button
                              onClick={() =>
                                setOpenGroups((g) => ({
                                  ...g,
                                  [groupName]: !isOpen,
                                }))
                              }
                              className="flex w-full items-center justify-between gap-3 px-6 py-3.5 text-start"
                            >
                              <span className="flex items-center gap-2 text-sm font-extrabold text-dark dark:text-white">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {isAr ? groupCfg.labelAr : groupCfg.label}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`text-gray-text transition-transform duration-300 ${
                                  isOpen ? "rotate-180 text-primary" : ""
                                }`}
                              />
                            </button>
                          </td>
                        </tr>,
                        ...(isOpen
                          ? keys.map((key, rowIdx) => (
                              <tr
                                key={key}
                                className={`group/row transition-colors ${
                                  rowIdx % 2 === 0
                                    ? "bg-white dark:bg-[#101013]"
                                    : "bg-gray-light/40 dark:bg-white/[0.015]"
                                } hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06]`}
                              >
                                <td className="sticky start-0 z-[1] border-t border-gray-border bg-inherit px-6 py-3.5 text-xs font-medium text-gray-text dark:border-white/10 dark:text-gray-400 group-hover/row:text-dark dark:group-hover/row:text-gray-100">
                                  {featureLabel(key, locale)}
                                </td>
                                {sortedPlans.map((plan) => {
                                  const features = plan.features as Record<
                                    string,
                                    unknown
                                  >;
                                  const isFeat = featuredPlan?.id === plan.id;
                                  return (
                                    <td
                                      key={plan.id}
                                      className={`border-s border-t border-gray-border px-4 py-3.5 text-center dark:border-white/10 ${
                                        isFeat
                                          ? "bg-primary/[0.04] dark:bg-primary/[0.08]"
                                          : ""
                                      }`}
                                    >
                                      <CellValue
                                        value={features[key]}
                                        locale={locale}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          : []),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 dark:bg-[#0F0F12]">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-dark dark:text-white sm:text-4xl">
              {T.faqHeading}
            </h2>
            <p className="mt-3 text-base text-gray-text dark:text-gray-400">
              {T.faqSub}
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#FAF7F2] pb-24 dark:bg-[#0B0B0F]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-dark p-1 shadow-2xl shadow-primary/20 dark:shadow-primary/10">
            {/* Rotating conic border */}
            <div className="featured-conic absolute -inset-[100%] opacity-70" />
            <div className="relative overflow-hidden rounded-[22px] bg-dark p-10 sm:p-14">
              {/* Background glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 end-0 h-72 w-72 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(232,152,58,0.4), transparent 70%)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 start-0 h-72 w-72 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(120,80,200,0.35), transparent 70%)",
                }}
              />

              <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {T.customCtaTitle}
                  </h2>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-white/70">
                    {T.customCtaSub}
                  </p>
                </div>

                <a
                  href="mailto:support@qafila.com"
                  className="group/cta inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/40 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/50"
                >
                  <Mail size={16} strokeWidth={2.5} />
                  {T.contact}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover/cta:translate-x-1 rtl:rotate-180 rtl:group-hover/cta:-translate-x-1"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {subscribingPlan && isLoggedIn && (
        <SubscribeModal
          plan={subscribingPlan}
          defaultBillingCycle={billingCycle}
          onClose={() => setSubscribingPlan(null)}
        />
      )}

      <LoginModal open={loginModalOpen} onClose={handleLoginClose} />
    </>
  );
}

// ── Local mini component (segment button) ───────────────────────────────────
function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold transition-all ${
        active
          ? "bg-dark text-white shadow-sm dark:bg-white dark:text-dark"
          : "text-gray-text hover:text-dark dark:text-gray-400 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
