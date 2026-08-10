import { getTranslations } from "next-intl/server";

export default async function SellCta() {
  const t = await getTranslations("sellCta");

  return (
    <section className="w-full bg-primary py-3.5">
      <div className="mx-auto max-w-360 text-center">
        <a
          href="https://business.qafila.com.sa"
          className="inline-flex items-center gap-2 text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          {t("text")}
          <span className="rtl:rotate-180">→</span>
        </a>
      </div>
    </section>
  );
}
