"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  Target,
  Eye,
} from "lucide-react";
import { getAbout } from "@/lib/api/about";
import type { AboutPage } from "@/types/about";

export default function AboutPageClient() {
  const locale = useLocale();
  const t = useTranslations("about");
  const isAr = locale === "ar";

  const [about, setAbout] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAbout();
        setAbout(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-10 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (error || !about) {
    return <p className="mt-10 text-center text-sm text-red-500">{t("error")}</p>;
  }

  const pick = (en: string, ar: string) => (isAr ? ar || en : en || ar);

  const title = pick(about.titleEn, about.titleAr) || t("title");
  const tagline = pick(about.taglineEn, about.taglineAr);
  const body = pick(about.bodyEn, about.bodyAr);
  const mission = pick(about.missionEn, about.missionAr);
  const vision = pick(about.visionEn, about.visionAr);
  const address = pick(about.addressEn, about.addressAr);

  const socials = [
    { key: "website", href: about.website, Icon: Globe, label: t("social.website") },
    { key: "facebook", href: about.facebook, Icon: Facebook, label: "Facebook" },
    { key: "instagram", href: about.instagram, Icon: Instagram, label: "Instagram" },
    { key: "twitter", href: about.twitter, Icon: Twitter, label: "X" },
    { key: "linkedin", href: about.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { key: "tiktok", href: about.tiktok, Icon: TikTokIcon, label: "TikTok" },
    { key: "snapchat", href: about.snapchat, Icon: SnapchatIcon, label: "Snapchat" },
    {
      key: "whatsapp",
      href: about.whatsapp,
      Icon: MessageCircle,
      label: "WhatsApp",
    },
  ].filter((s) => s.href && s.href.trim().length > 0);

  const contacts = [
    about.email && {
      Icon: Mail,
      label: about.email,
      href: `mailto:${about.email}`,
      dir: "ltr" as const,
    },
    about.phone && {
      Icon: Phone,
      label: about.phone,
      href: `tel:${about.phone.replace(/\s+/g, "")}`,
      dir: "ltr" as const,
    },
    address && { Icon: MapPin, label: address, href: undefined, dir: undefined },
  ].filter(Boolean) as {
    Icon: typeof Mail;
    label: string;
    href?: string;
    dir?: "ltr";
  }[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-dark dark:text-gray-100">
          {title}
        </h1>
        {tagline && (
          <p className="mt-2 text-base text-primary font-medium">{tagline}</p>
        )}
      </header>

      {/* Body */}
      {body && (
        <section className="space-y-4">
          {body.split(/\n{2,}/).map((para, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-gray-text dark:text-gray-300"
            >
              {para}
            </p>
          ))}
        </section>
      )}

      {/* Mission & Vision */}
      {(mission || vision) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {mission && (
            <InfoCard Icon={Target} title={t("mission")} text={mission} />
          )}
          {vision && <InfoCard Icon={Eye} title={t("vision")} text={vision} />}
        </section>
      )}

      {/* Contact */}
      {contacts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-dark dark:text-gray-100">
            {t("contact")}
          </h2>
          <div className="mt-4 space-y-3">
            {contacts.map((c, i) => {
              const inner = (
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <c.Icon size={18} />
                  </span>
                  <span
                    className="text-sm text-dark dark:text-gray-200"
                    dir={c.dir}
                  >
                    {c.label}
                  </span>
                </span>
              );
              return c.href ? (
                <a
                  key={i}
                  href={c.href}
                  className="block w-fit transition-opacity hover:opacity-80"
                >
                  {inner}
                </a>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        </section>
      )}

      {/* Social links */}
      {socials.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-dark dark:text-gray-100">
            {t("followUs")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {socials.map(({ key, href, Icon, label }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-border dark:border-gray-700 text-dark dark:text-gray-200 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({
  Icon,
  title,
  text,
}: {
  Icon: typeof Target;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-border dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 text-primary">
        <Icon size={20} />
        <h3 className="text-base font-semibold text-dark dark:text-gray-100">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-text dark:text-gray-300">
        {text}
      </p>
    </div>
  );
}

// lucide-react ships no accurate TikTok / Snapchat marks — inline them.
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.53 1.5c1.03 0 2.06 0 3.09.01.06 1.2.5 2.42 1.38 3.27.88.88 2.12 1.28 3.32 1.42v3.19c-1.12-.04-2.25-.27-3.27-.75-.44-.2-.85-.46-1.26-.72-.01 2.31.01 4.62-.02 6.92-.06 1.11-.43 2.21-1.07 3.12-1.04 1.52-2.84 2.51-4.68 2.54-1.13.06-2.26-.24-3.22-.81-1.59-.94-2.71-2.66-2.87-4.5-.02-.4-.03-.79-.01-1.18.14-1.47.87-2.87 2-3.83 1.28-1.11 3.07-1.64 4.74-1.32.02 1.17-.03 2.34-.03 3.51-.77-.25-1.66-.18-2.33.28-.49.32-.86.81-1.05 1.36-.16.4-.11.83-.1 1.25.18 1.24 1.37 2.28 2.64 2.17.84-.01 1.65-.5 2.09-1.21.14-.25.3-.51.31-.81.08-1.36.05-2.72.06-4.08.01-3.06-.01-6.11.02-9.16z" />
    </svg>
  );
}

function SnapchatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.03 2c.7.01 2.47.16 3.4 2.24.33.74.25 1.99.18 3-.01.14-.02.28-.03.42.06.03.15.05.27.05.28-.02.62-.12.98-.29.15-.06.31-.09.47-.09.19 0 .38.04.55.11.28.11.46.31.47.55.01.31-.27.58-.85.8-.07.03-.16.06-.26.09-.35.11-.89.28-1.03.61-.07.17-.04.39.09.65l.01.02c.04.09 1.05 2.29 3.19 2.64.17.03.29.18.28.35 0 .05-.01.1-.03.15-.15.35-.79.61-1.95.79-.04.05-.08.24-.11.37-.03.13-.06.26-.1.4-.05.17-.17.25-.35.25h-.03c-.12 0-.29-.03-.5-.07-.31-.07-.69-.15-1.15-.15-.27 0-.55.02-.83.07-.54.09-.99.41-1.51.78-.74.53-1.58 1.12-2.85 1.12l-.11-.01h-.08c-1.27 0-2.1-.59-2.84-1.12-.52-.37-.97-.69-1.51-.78-.28-.05-.56-.07-.83-.07-.48 0-.86.09-1.15.15-.2.04-.38.08-.5.08-.23.01-.34-.13-.38-.26-.04-.14-.07-.27-.1-.4-.03-.13-.07-.32-.11-.37-1.16-.18-1.8-.44-1.95-.79-.02-.05-.03-.1-.03-.15-.01-.17.11-.32.28-.35 2.14-.35 3.15-2.55 3.19-2.64l.01-.02c.13-.26.16-.48.09-.65-.14-.33-.68-.5-1.03-.61-.1-.03-.19-.06-.26-.09-.79-.31-.9-.66-.85-.9.06-.28.42-.47.75-.47.11 0 .21.02.3.06.34.16.65.25.92.27.14.01.24-.02.31-.05-.01-.14-.02-.28-.03-.42-.07-1.01-.15-2.26.18-3C9.5 2.16 11.28 2.01 12.03 2z" />
    </svg>
  );
}
