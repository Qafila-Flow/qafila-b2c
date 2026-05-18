"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import {
  Search,
  Heart,
  ShoppingBasket,
  Menu,
  ChevronDown,
  ChevronRight,
  Globe,
  Clapperboard,
  User,
  CircleHelp,
  Bell,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import MegaMenu from "@/components/layout/MegaMenu";
import type { Category } from "@/types/category";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useActiveCategory } from "@/lib/active-category-context";
import LoginModal from "@/components/auth/LoginModal";
import { useTheme } from "@/lib/theme-context";

interface HeaderProps {
  categoryTree?: Category[];
}

export default function Header({ categoryTree = [] }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const loginDropdownRef = useRef<HTMLDivElement>(null);

  const rootTabs = categoryTree.filter((c) => c.parentId === null);
  const { activeRootSlug, setActiveRootSlug } = useActiveCategory();

  const switchLocale = (newLocale: "en" | "ar") => {
    router.replace(pathname, { locale: newLocale });
    setLangOpen(false);
  };

  const handleTabClick = (slug: string) => {
    setActiveRootSlug(slug);
  };

  const closeMegaMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Close login dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        loginDropdownRef.current &&
        !loginDropdownRef.current.contains(e.target as Node)
      ) {
        setLoginDropdownOpen(false);
      }
    };
    if (loginDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [loginDropdownOpen]);

  // Body scroll lock for mobile drawer
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-dark shadow-sm dark:shadow-dark/50">
        {/* Top Bar - hidden on mobile */}
        <div className="hidden bg-dark text-white md:block">
          <div className="mx-auto flex max-w-360 items-stretch justify-between px-6 text-sm">
            {/* Left - Tabs */}
            <div className="flex items-stretch gap-4">
              {rootTabs.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleTabClick(cat.slug)}
                  className={`flex items-center px-2 py-2 transition-colors font-medium ${
                    activeRootSlug === cat.slug
                      ? "text-black bg-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {locale === "ar" ? cat.nameAr || cat.name : cat.name}
                </button>
              ))}
            </div>

            {/* Center - Apple Pay */}
            <span className="hidden items-center text-xs font-medium md:flex">
              {t("topBar.applePay")}
            </span>

            {/* Right - Language */}
            <div className="relative flex items-center gap-3 py-2">
              <div className="flex items-center gap-1">
                <Globe size={14} />
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 text-xs"
                >
                  {locale === "en" ? t("topBar.english") : t("topBar.arabic")}
                  <ChevronDown size={12} />
                </button>
              </div>
              {langOpen && (
                <div className="absolute end-0 top-full mt-1 min-w-30 rounded bg-dark shadow-lg">
                  <button
                    onClick={() => switchLocale("en")}
                    className="block w-full px-4 py-2 text-start text-xs hover:bg-gray-700"
                  >
                    {t("topBar.english")}
                  </button>
                  <button
                    onClick={() => switchLocale("ar")}
                    className="block w-full px-4 py-2 text-start text-xs hover:bg-gray-700"
                  >
                    {t("topBar.arabic")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Bar - Logo, Search, Icons */}
        <div className="border-b border-gray-border dark:border-gray-700">
          <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-6 py-3">
            {/* Mobile hamburger + Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center justify-center text-dark dark:text-gray-200 md:hidden"
                aria-label={t("nav.menu")}
              >
                <Menu size={22} />
              </button>
              <Link href="/" className="shrink-0">
                <div className="flex items-center gap-1.5">
                  <Image
                    src={theme === "dark" ? "/logo-footer.svg" : "/logo.svg"}
                    height={48}
                    width={150}
                    alt="qafila"
                  />
                </div>
              </Link>
            </div>

            {/* Search */}
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search
                size={16}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-text"
              />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                className="w-full rounded-full border border-gray-border bg-gray-light py-2.5 pe-4 ps-10 text-sm outline-none transition-colors focus:border-primary dark:bg-dark dark:border-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-5">
              <Link
                href="/stories"
                className="hidden items-center gap-1.5 text-sm text-dark dark:text-gray-200 md:flex"
              >
                <Clapperboard size={18} />
                <span>{t("header.stories")}</span>
              </Link>
              <Link
                href="/profile/wishlist"
                className="relative flex items-center gap-1.5 text-sm text-dark dark:text-gray-200"
              >
                <Heart size={18} />
                <span className="hidden md:inline">{t("header.wishlist")}</span>
                {wishlistCount > 0 && (
                  <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-discount px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 text-sm text-dark dark:text-gray-200"
              >
                <ShoppingBasket size={18} />
                <span className="hidden md:inline">{t("header.cart")}</span>
                {itemCount > 0 && (
                  <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <div className="hidden h-5 w-px bg-gray-border dark:bg-gray-700 md:block" />

              {/* Notifications */}
              <Link
                href="/profile/notifications"
                className="relative hidden text-dark dark:text-gray-200 md:block"
              >
                <Bell size={18} />
              </Link>

              {/* Divider */}
              <div className="hidden h-5 w-px bg-gray-border dark:bg-gray-700 md:block" />

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="hidden items-center text-dark dark:text-gray-200 md:flex"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Divider */}
              <div className="hidden h-5 w-px bg-gray-border dark:bg-gray-700 md:block" />

              {/* Login / User dropdown */}
              <div className="relative" ref={loginDropdownRef}>
                <button
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  className="flex items-center gap-1.5 text-sm text-dark dark:text-gray-200 cursor-pointer"
                >
                  {isLoggedIn ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-dark dark:text-gray-200">
                      {(user?.firstName?.[0] || "").toUpperCase()}
                      {(user?.lastName?.[0] || "").toUpperCase()}
                    </span>
                  ) : (
                    <>
                      <User size={18} />
                      <span className="hidden md:inline">
                        {t("auth.logIn")}
                      </span>
                    </>
                  )}
                  <ChevronDown size={14} className="hidden md:block" />
                </button>

                {loginDropdownOpen && (
                  <div className="absolute end-0 top-full mt-3 w-72 rounded-xl bg-white dark:bg-dark shadow-lg ring-1 ring-gray-border dark:ring-gray-700 z-10">
                    {/* Arrow */}
                    <div className="absolute -top-1.5 end-5 h-3 w-3 rotate-45 border-s border-t border-gray-border dark:border-gray-700 bg-white dark:bg-dark" />

                    {isLoggedIn ? (
                      <>
                        {/* Greeting */}
                        <div className="px-5 pb-4 pt-5">
                          <p className="text-lg font-semibold text-dark dark:text-gray-100">
                            {t("auth.greeting", {
                              name: user?.firstName || "",
                            })}{" "}
                            <span>👋🏻</span>
                          </p>
                          {user?.email && (
                            <p className="mt-1 text-sm text-gray-text">
                              {user.email}
                            </p>
                          )}
                        </div>

                        {/* Menu Items */}
                        {[
                          { href: "/profile", label: t("auth.myAccount") },
                          { href: "/profile/orders", label: t("auth.orders") },
                          {
                            href: "/profile/addresses",
                            label: t("auth.addresses"),
                          },
                          { href: "/contact", label: t("auth.contactUs") },
                          { href: "/faqs", label: t("auth.faqs") },
                        ].map((item, i) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between ${i !== 0 ? "border-t" : ""} border-gray-border dark:border-gray-700 px-5 py-3.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80`}
                            onClick={() => setLoginDropdownOpen(false)}
                          >
                            {item.label}
                            <ChevronRight size={16} className="text-gray-400" />
                          </Link>
                        ))}

                        {/* Logout */}
                        <button
                          onClick={() => {
                            logout();
                            setLoginDropdownOpen(false);
                          }}
                          className="w-full border-t border-gray-border dark:border-gray-700 px-5 py-3.5 text-start text-sm text-gray-text hover:bg-gray-50 dark:hover:bg-dark/80"
                        >
                          {t("auth.logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-3 pb-2 pt-3">
                          <button
                            onClick={() => {
                              setLoginDropdownOpen(false);
                              setLoginModalOpen(true);
                            }}
                            className="w-full rounded-md bg-dark py-2.5 text-xs font-semibold text-white transition-colors hover:bg-dark/90"
                          >
                            {t("auth.loginSignup")}
                          </button>
                        </div>
                        <div className="px-3 pb-2">
                          <button className="w-full rounded-md border border-gray-border dark:border-gray-600 py-2.5 text-xs font-semibold text-dark dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80">
                            {t("auth.becomeSeller")}
                          </button>
                        </div>
                        <div className="border-t border-gray-border dark:border-gray-700">
                          <Link
                            href="#"
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                            onClick={() => setLoginDropdownOpen(false)}
                          >
                            <span className="flex items-center gap-2">
                              <CircleHelp size={16} />
                              {t("auth.helpCenter")}
                            </span>
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - hidden on mobile */}
        <div className="relative hidden border-b border-gray-border dark:border-gray-700 md:block">
          <div className="mx-auto flex max-w-360 items-center gap-1 px-6 py-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
            >
              <Menu size={16} />
              {t("nav.categories")}
              <ChevronDown
                size={14}
                className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {(
              [
                { href: "/tags/limited-editions", label: "nav.tagLimitedEditions" },
                { href: "/tags/luxuries", label: "nav.tagLuxuries" },
                { href: "/tags/originals", label: "nav.tagOriginals" },
              ] as const
            ).map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "font-bold text-primary"
                      : "font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                  }`}
                >
                  {t(label)}
                </Link>
              );
            })}
            <Link
              href="/research"
              className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
            >
              {t("nav.researchAI")}
            </Link>
            <Link
              href="/pricing"
              className="ms-1 rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t("nav.priceAccess")}
            </Link>
          </div>

          {/* Mega Menu */}
          {menuOpen && categoryTree.length > 0 && (
            <MegaMenu
              categoryTree={categoryTree}
              activeRootSlug={activeRootSlug}
              locale={locale}
              onClose={closeMegaMenu}
            />
          )}
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${
          mobileDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileDrawerOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 start-0 z-50 w-[300px] overflow-y-auto bg-white dark:bg-dark shadow-xl transition-transform duration-300 md:hidden ${
          mobileDrawerOpen
            ? "translate-x-0 rtl:-translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-border dark:border-gray-700 px-5 py-4">
          <h2 className="text-base font-bold text-dark dark:text-gray-100">
            {t("nav.menu")}
          </h2>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle - mobile */}
            <button
              onClick={toggleTheme}
              className="text-dark dark:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close"
            >
              <X size={20} className="text-gray-text" />
            </button>
          </div>
        </div>

        {/* Drawer Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-text"
            />
            <input
              type="text"
              placeholder={t("search.placeholder")}
              className="w-full rounded-full border border-gray-border bg-gray-light py-2.5 pe-4 ps-10 text-sm outline-none transition-colors focus:border-primary dark:bg-dark dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="px-5 py-3">
          <ul className="space-y-1">
            {(
              [
                { href: "/tags/limited-editions", label: "nav.tagLimitedEditions" },
                { href: "/tags/luxuries", label: "nav.tagLuxuries" },
                { href: "/tags/originals", label: "nav.tagOriginals" },
              ] as const
            ).map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "font-bold text-primary"
                        : "font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                    }`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {t(label)}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/research"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                onClick={() => setMobileDrawerOpen(false)}
              >
                {t("nav.researchAI")}
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full text-center justify-center"
                onClick={() => setMobileDrawerOpen(false)}
              >
                {t("nav.priceAccess")}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-border dark:border-gray-700" />

        {/* Stories & Notifications */}
        <div className="px-5 py-3">
          <ul className="space-y-1">
            <li>
              <Link
                href="/stories"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <Clapperboard size={18} />
                {t("header.stories")}
              </Link>
            </li>
            <li>
              <Link
                href="/profile/notifications"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <Bell size={18} />
                {t("notifications.title")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-border dark:border-gray-700" />

        {/* Category Tabs */}
        {rootTabs.length > 0 && (
          <div className="px-5 py-3">
            <ul className="space-y-1">
              {rootTabs.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => {
                      handleTabClick(cat.slug);
                      setMobileDrawerOpen(false);
                    }}
                    className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeRootSlug === cat.slug
                        ? "bg-dark text-white"
                        : "text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
                    }`}
                  >
                    {locale === "ar" ? cat.nameAr || cat.name : cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 border-t border-gray-border dark:border-gray-700" />

        {/* Language Switcher */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <Globe size={18} className="text-dark dark:text-gray-200" />
            <button
              onClick={() => {
                switchLocale(locale === "en" ? "ar" : "en");
                setMobileDrawerOpen(false);
              }}
              className="text-sm font-medium text-dark dark:text-gray-200"
            >
              {locale === "en" ? t("topBar.arabic") : t("topBar.english")}
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
