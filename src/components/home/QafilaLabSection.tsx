import { getTranslations } from "next-intl/server";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMediaUrl } from "@/lib/utils";
import type { VendorProfile } from "@/lib/api/vendors";
import LabTypeTag from "@/components/qafila-lab/LabTypeTag";

interface Props {
  vendors: VendorProfile[];
  locale: string;
}

export default async function QafilaLabSection({ vendors, locale }: Props) {
  if (!vendors.length) return null;

  const t = await getTranslations("qafilaLab");

  return (
    <section className="mx-4 my-8 md:mx-20">
      <div className="relative overflow-hidden rounded-3xl">
        {/* Premium dark/gold background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B07] via-[#1B140C] to-[#0F0B07]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.10),transparent_60%)]" />

        <div className="relative z-10 px-6 py-10 md:px-12 md:py-14">
          {/* Heading */}
          <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-3 w-3" />
                {t("eyebrow")}
              </div>
              <h2 className="font-serif text-3xl font-bold leading-tight text-white md:text-5xl">
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  {t("title")}
                </span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
                {t("subtitle")}
              </p>
            </div>

            <Link
              href="/qafila-lab"
              className="group inline-flex items-center gap-2 self-start rounded-full border border-amber-400/40 bg-white/5 px-5 py-2.5 text-sm font-medium text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-500/10 md:self-auto"
            >
              {t("viewAll")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* Vendor cards grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {vendors.slice(0, 8).map((vendor) => {
              const name =
                locale === "ar"
                  ? vendor.storeNameAr || vendor.storeName
                  : vendor.storeName;
              const description =
                locale === "ar"
                  ? vendor.descriptionAr || vendor.description
                  : vendor.description;
              const logoUrl = vendor.logo ? getMediaUrl(vendor.logo) : null;

              return (
                <Link
                  key={vendor.id}
                  href={`/qafila-lab/${vendor.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-amber-400/40 hover:bg-white/10"
                >
                  {/* Logo */}
                  <div className="mb-4 flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100/95 to-white/95">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={name}
                        className="max-h-16 max-w-[80%] object-contain"
                      />
                    ) : (
                      <div className="text-2xl font-serif font-bold text-[#0F0B07]">
                        {name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-white md:text-base">
                      {name}
                    </h3>
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300/80 transition group-hover:text-amber-300" />
                  </div>
                  {vendor.qafilaLabType && (
                    <div className="mt-2">
                      <LabTypeTag
                        type={vendor.qafilaLabType}
                        label={
                          vendor.qafilaLabType === "DESIGNER"
                            ? t("designer")
                            : t("manufacturer")
                        }
                        variant="dark"
                      />
                    </div>
                  )}
                  {description && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/55">
                      {description}
                    </p>
                  )}

                  {vendor.productCount > 0 && (
                    <p className="mt-3 text-[11px] uppercase tracking-wider text-amber-300/70">
                      {t("productsCount", { count: vendor.productCount })}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
