"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import QafilaLogo from "@/components/shared/QafilaLogo";
import Image from "next/image";

// ─── Brand icons ─────────────────────────────────────────────────────────────
// Inline SVGs (lucide doesn't ship accurate marks for TikTok / Snapchat /
// WhatsApp / X). All use `fill-current` so they inherit the link colour.

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.07A6.33 6.33 0 0 0 5.83 20.1a6.34 6.34 0 0 0 10.86-4.43V8.85a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1.87-.24Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
    </svg>
  );
}

function SnapchatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.074-.012.16 0 .3.075.42.194.12.12.18.272.18.405 0 .24-.18.45-.48.57-.07.03-.18.06-.3.09-.18.06-.39.12-.57.21-.36.18-.57.39-.66.57a.65.65 0 0 0-.06.27c.06.39.27.78.54 1.17.33.45.72.87 1.17 1.23.45.39.93.72 1.47.96.12.06.24.12.33.18.12.06.21.18.21.3 0 .15-.09.27-.21.36-.18.12-.42.24-.69.3-.3.09-.6.12-.87.12-.09 0-.18 0-.27-.015-.12-.015-.27-.03-.45-.06-.24-.03-.54-.06-.87-.09-.51-.03-1.08.15-1.59.42-.54.27-1.02.63-1.44.99-.45.39-.93.63-1.44.69-.06 0-.12.01-.18.01h-.15c-.51-.06-.99-.3-1.44-.69-.42-.36-.9-.72-1.44-.99-.51-.27-1.08-.45-1.59-.42-.33.03-.63.06-.87.09-.18.03-.33.045-.45.06-.09.015-.18.015-.27.015-.27 0-.57-.03-.87-.12-.27-.06-.51-.18-.69-.3-.12-.09-.21-.21-.21-.36 0-.12.09-.24.21-.3.09-.06.21-.12.33-.18.54-.24 1.02-.57 1.47-.96.45-.36.84-.78 1.17-1.23.27-.39.48-.78.54-1.17a.65.65 0 0 0-.06-.27c-.09-.18-.3-.39-.66-.57-.18-.09-.39-.15-.57-.21-.12-.03-.23-.06-.3-.09-.3-.12-.48-.33-.48-.57 0-.133.06-.285.18-.405.12-.12.26-.194.42-.194.015 0 .034 0 .074.012.263.094.623.214.922.214.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.653 1.069 11.01.793 12 .793h.206z" />
    </svg>
  );
}

// Single source of truth — order is intentional: communication first
// (Gmail/WhatsApp), then social networks.
const SOCIAL_LINKS = [
  {
    label: "Gmail",
    href: "mailto:qafilaflow@gmail.com",
    Icon: GmailIcon,
    hover: "hover:text-red-500",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/966539700630",
    Icon: WhatsAppIcon,
    hover: "hover:text-[#25D366]",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/qafilaflow",
    Icon: LinkedInIcon,
    hover: "hover:text-[#0A66C2]",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/Qafila.com.sa",
    Icon: FacebookIcon,
    hover: "hover:text-[#1877F2]",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/Qafila.com.sa",
    Icon: InstagramIcon,
    hover: "hover:text-[#E4405F]",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@qafilaflow",
    Icon: TikTokIcon,
    hover: "hover:text-white",
  },
  {
    label: "X",
    href: "https://x.com/QafilaFlow",
    Icon: XIcon,
    hover: "hover:text-white",
  },
  {
    label: "Snapchat",
    href: "https://www.snapchat.com/add/Qafilaflow",
    Icon: SnapchatIcon,
    hover: "hover:text-[#FFFC00]",
  },
] as const;

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="bg-dark text-white">
      {/* Top section */}
      <div className="mx-auto max-w-360 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-gray-700 pb-10 md:flex-row md:items-center">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <Image
              src={"/logo-footer.svg"}
              height={24}
              width={120}
              alt="qafila"
            />
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("subscribe")}
            </span>
            <div className="flex">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="rounded-s-md border border-gray-600 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-gray-500 focus:border-primary"
              />
              <button className="rounded-e-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                {t("subscribeBtn")}
              </button>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("followUs")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`grid h-9 w-9 place-items-center rounded-full border border-gray-700 bg-white/5 text-gray-300 transition-all duration-200 hover:scale-110 hover:border-transparent hover:bg-white/10 ${hover}`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 pt-10 md:grid-cols-3 lg:grid-cols-6">
          {/* Top Brands */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("topBrands")}</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.atelierHekayat")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.uscita")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.hajruss")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.kafByKaf")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.atelierHekayat")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("brands.hindamme")}
                </a>
              </li>
            </ul>
          </div>

          {/* Discover Now */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("discoverNow")}</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.mensFashion")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.womensFashion")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.kids")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.luxuryGoods")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.eyewear")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.beautyPersonalCare")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.toysPassion")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("discover.furniture")}
                </a>
              </li>
            </ul>
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("topCategories")}</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.clothing")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.shoes")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.sandless")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.glasses")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.pants")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("topCats.suites")}
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("customerCare")}</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.contactUs")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.faqs")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.payment")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.trackOrder")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.aboutUs")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("care.careers")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("legal")}</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  {t("legalLinks.termsConditions")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("legalLinks.privacyPolicy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("legalLinks.returnPolicy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {t("legalLinks.shippingDelivery")}
                </a>
              </li>
              <li>
                <a
                  href="/vat-info.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {t("legalLinks.ksaVat")}
                </a>
              </li>
            </ul>
          </div>

          {/* Qafila Apps */}
          <div>
            <h4 className="mb-4 text-sm font-bold">{t("qafilaApps")}</h4>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 transition-colors hover:border-gray-400"
              >
                <Image
                  src="/images/apple-icon.svg"
                  alt="Apple"
                  width={18}
                  height={22}
                  className="shrink-0"
                />
                <div className="text-start">
                  <p className="text-[8px] leading-none text-gray-400">
                    {t("downloadOn")}
                  </p>
                  <p className="text-xs font-semibold leading-tight text-white">
                    {t("appStore")}
                  </p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 transition-colors hover:border-gray-400"
              >
                <Image
                  src="/images/google-play-icon.svg"
                  alt="Google Play"
                  width={20}
                  height={22}
                  className="shrink-0"
                />
                <div className="text-start">
                  <p className="text-[8px] leading-none text-gray-400">
                    {t("getItOn")}
                  </p>
                  <p className="text-xs font-semibold leading-tight text-white">
                    {t("googlePlay")}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
