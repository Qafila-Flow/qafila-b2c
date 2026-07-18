"use client";

import { useTranslations } from "next-intl";
import {
  Bell,
  Heart,
  Package,
  MapPin,
  Wallet,
  PhoneCall,
  CircleHelp,
  ChevronRight,
  LogOut,
  CreditCard,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";

// Qafila "about" icon — just uses a simple home/store shape
function QafilaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export default function ProfileSidebar() {
  const t = useTranslations("profile");
  const { user, logout, isLoggedIn } = useAuth();
  const router = useRouter();

  if (!isLoggedIn || !user) return null;

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Calculate profile completeness
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.gender,
    user.birthDate,
  ];
  const filled = fields.filter(Boolean).length;
  const completeness = Math.round((filled / fields.length) * 100);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className="w-full lg:w-[300px] shrink-0">
      {/* User card */}
      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-xl border border-gray-border dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80"
      >
        {/* Avatar with completion ring */}
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <span className="text-base font-bold text-gray-text">
              {initials}
            </span>
          </div>
          {/* Completion badge */}
          <div className="absolute -bottom-1 -start-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
            {completeness}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark dark:text-gray-100 truncate">{fullName}</p>
          {user.email && (
            <p className="text-xs text-gray-text truncate">{user.email}</p>
          )}
          <p className="mt-0.5 text-[11px] text-gray-text">
            {t("completeProfile")}
          </p>
        </div>

        <ChevronRight
          size={16}
          className="shrink-0 text-gray-text rtl:rotate-180"
        />
      </Link>

      {/* Notifications */}
      <div className="mt-3 rounded-xl border border-gray-border dark:border-gray-700">
        <SidebarLink
          href="/profile/notifications"
          icon={<Bell size={20} />}
          label={t("sidebar.notifications")}
          description={t("sidebar.notificationsDesc")}
        />
      </div>

      {/* Main nav group */}
      <div className="mt-3 rounded-xl border border-gray-border dark:border-gray-700 divide-y divide-gray-border dark:divide-gray-700">
        <SidebarLink
          href="/profile/wishlist"
          icon={<Heart size={20} />}
          label={t("sidebar.wishlist")}
        />
        <SidebarLink
          href="/profile/orders"
          icon={<Package size={20} />}
          label={t("sidebar.ordersReturns")}
        />
        <SidebarLink
          href="/profile/addresses"
          icon={<MapPin size={20} />}
          label={t("sidebar.addresses")}
        />
        <SidebarLink
          href="/profile/subscription"
          icon={<CreditCard size={20} />}
          label="My Subscription"
        />
        <SidebarLink
          href="/profile"
          icon={<Wallet size={20} />}
          label={t("sidebar.wallet")}
        />
      </div>

      {/* Info group */}
      <div className="mt-3 rounded-xl border border-gray-border dark:border-gray-700 divide-y divide-gray-border dark:divide-gray-700">
        <SidebarLink
          href="/profile"
          icon={<PhoneCall size={20} />}
          label={t("sidebar.contactUs")}
        />
        <SidebarLink
          href="/profile/faqs"
          icon={<CircleHelp size={20} />}
          label={t("sidebar.faqs")}
        />
        <SidebarLink
          href="/profile/about"
          icon={<QafilaIcon size={20} />}
          label={t("sidebar.aboutQafila")}
        />
      </div>

      {/* Logout */}
      <div className="mt-3 rounded-xl border border-gray-border dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80"
        >
          <LogOut size={20} className="shrink-0 text-dark dark:text-gray-200" />
          <span className="text-sm font-medium text-dark dark:text-gray-200">
            {t("sidebar.logout")}
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/profile"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80 ${
        isActive ? "bg-primary/5" : ""
      }`}
    >
      <span className={`shrink-0 ${isActive ? "text-primary" : "text-dark dark:text-gray-200"}`}>
        {icon}
      </span>
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${isActive ? "text-primary" : "text-dark dark:text-gray-200"}`}
        >
          {label}
        </span>
        {description && (
          <p className="text-[11px] text-gray-text">{description}</p>
        )}
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-gray-text rtl:rotate-180"
      />
    </Link>
  );
}
