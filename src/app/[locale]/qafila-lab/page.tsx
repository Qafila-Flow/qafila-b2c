import { setRequestLocale, getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getQafilaLabVendors, type VendorProfile } from "@/lib/api/vendors";
import { getMediaUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QafilaLabIndexPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("qafilaLab");

  const page = sp.page ? Number(sp.page) : 1;
  const limit = 24;

  let vendors: VendorProfile[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const res = await getQafilaLabVendors({ page, limit });
    vendors = res.vendors;
    total = res.total;
    totalPages = res.totalPages;
  } catch {
    // empty state will render
  }

  return (
    <div className="bg-white pb-16 dark:bg-[#0f0f0f]">
      {/* Premium dark/gold hero — matches the homepage section style */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B07] via-[#1B140C] to-[#0F0B07]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.10),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-360 px-4 py-16 md:px-20 md:py-24">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            <Sparkles className="h-3 w-3" />
            {t("eyebrow")}
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Vendor grid */}
      <section className="mx-auto max-w-360 px-4 py-12 sm:px-6 md:px-20">
        {vendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center dark:border-gray-700">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-amber-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("noVendors")}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("vendorsCount", { count: total })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {vendors.map((vendor) => {
                const name =
                  locale === "ar"
                    ? vendor.storeNameAr || vendor.storeName
                    : vendor.storeName;
                const description =
                  locale === "ar"
                    ? vendor.descriptionAr || vendor.description
                    : vendor.description;
                const logoUrl = vendor.logo ? getMediaUrl(vendor.logo) : null;
                const bannerUrl = vendor.banner
                  ? getMediaUrl(vendor.banner)
                  : null;

                return (
                  <Link
                    key={vendor.id}
                    href={`/qafila-lab/${vendor.slug}`}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-gray-700 dark:bg-dark dark:shadow-black/40 dark:hover:border-amber-500/50"
                  >
                    {/* Banner / fallback */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-[#1f1810] dark:to-dark">
                      {bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={bannerUrl}
                          alt={name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.25),transparent_60%)]" />
                      )}
                    </div>

                    {/* Body */}
                    <div className="relative -mt-10 px-5 pb-5">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt={name}
                            className="max-h-12 max-w-[78%] object-contain"
                          />
                        ) : (
                          <div className="font-serif text-2xl font-bold text-[#0F0B07] dark:text-amber-200">
                            {name?.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-base font-semibold text-dark dark:text-gray-100">
                          {name}
                        </h3>
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      </div>
                      {description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                      )}

                      {vendor.productCount > 0 && (
                        <p className="mt-3 text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {t("productsCount", { count: vendor.productCount })}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/qafila-lab?page=${page - 1}`}
                    className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-dark transition hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-500/60 dark:hover:text-amber-300"
                  >
                    {t("prev")}
                  </Link>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("pageOf", { page, total: totalPages })}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/qafila-lab?page=${page + 1}`}
                    className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-dark transition hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-500/60 dark:hover:text-amber-300"
                  >
                    {t("next")}
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
