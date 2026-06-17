import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Sparkles, Star, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getVendorBySlug } from "@/lib/api/vendors";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct } from "@/lib/api/products";
import { getMediaUrl } from "@/lib/utils";
import ProductCard, { type Product } from "@/components/shared/ProductCard";

function mapApiProduct(item: ApiProduct, locale: string): Product {
  const price = Number(item.price);
  const salePrice = item.salePrice != null ? Number(item.salePrice) : null;
  const hasSale = salePrice != null && salePrice < price;
  const displayPrice = hasSale ? salePrice! : price;
  const originalPrice = hasSale ? price : null;
  const discount = hasSale
    ? Math.round(((price - salePrice!) / price) * 100)
    : null;

  const name =
    locale === "ar"
      ? item.brand?.nameAr || item.brand?.name || item.titleAr || item.title
      : item.brand?.name || item.title;

  const description =
    locale === "ar" ? item.titleAr || item.title : item.title;

  const imageUrl = item.images?.[0]?.url
    ? getMediaUrl(item.images[0].url)
    : null;

  return {
    id: item.id,
    name,
    description,
    price: displayPrice,
    originalPrice,
    discount,
    rating: Number(item.averageRating),
    reviews: item.reviewCount,
    trending: item.isFeatured,
    badge: hasSale ? `${discount}%` : null,
    image: imageUrl,
    slug: item.slug,
    tags: item.tags ?? [],
  };
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QafilaLabVendorPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("qafilaLab");

  let vendor;
  try {
    vendor = await getVendorBySlug(slug);
  } catch {
    notFound();
  }

  // Hard-block: this route is exclusively for Qafila Lab vendors.
  if (!vendor.isQafilaLab) {
    notFound();
  }

  const page = sp.page ? Number(sp.page) : 1;
  const limit = 24;

  const productsRes = await getProducts({
    vendorId: vendor.id,
    page,
    limit,
  }).catch(() => ({
    data: [] as ApiProduct[],
    meta: { total: 0, page: 1, limit, totalPages: 0 },
  }));

  const products: Product[] = productsRes.data.map((item) =>
    mapApiProduct(item, locale),
  );

  const name =
    locale === "ar"
      ? vendor.storeNameAr || vendor.storeName
      : vendor.storeName;
  const description =
    locale === "ar"
      ? vendor.descriptionAr || vendor.description
      : vendor.description;

  const bannerUrl = vendor.banner ? getMediaUrl(vendor.banner) : null;
  const logoUrl = vendor.logo ? getMediaUrl(vendor.logo) : null;
  const rating = vendor.rating ? Number(vendor.rating) : null;

  return (
    <div className="bg-white pb-16 dark:bg-[#0f0f0f]">
      {/* Hero — full-width banner with overlaid logo + brand info */}
      <section className="relative h-[480px] w-full overflow-hidden md:h-[560px]">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B07] via-[#1B140C] to-[#0F0B07]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.25),transparent_55%)]" />
          </div>
        )}

        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* Top eyebrow badge */}
        <div className="absolute top-6 z-10 mx-4 md:top-10 md:mx-20">
          <Link
            href="/qafila-lab"
            className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur transition hover:border-amber-300/80 hover:bg-black/50"
          >
            <Sparkles className="h-3 w-3" />
            {t("title")}
          </Link>
        </div>

        {/* Overlaid content */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10 md:px-20 md:pb-14">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            {/* Logo card */}
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-2xl md:h-36 md:w-36">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={name}
                  className="max-h-[78%] max-w-[78%] object-contain"
                />
              ) : (
                <div className="font-serif text-4xl font-bold text-[#0F0B07]">
                  {name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Name + meta + description */}
            <div className="flex-1">
              <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-6xl">
                {name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                {rating != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    <span className="font-semibold">{rating.toFixed(1)}</span>
                    <span className="text-white/60">
                      ({vendor.reviewCount})
                    </span>
                  </span>
                )}
                {vendor.followerCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-white/70" />
                    <span>
                      {t("followers", { count: vendor.followerCount })}
                    </span>
                  </span>
                )}
              </div>

              {description && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 md:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products — clean grid, no filters */}
      <section className="mx-auto max-w-360 px-4 pt-12 sm:px-6 md:px-20">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold text-dark md:text-3xl dark:text-gray-100">
            {t("collection")}
          </h2>
          {productsRes.meta.total > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("productsCount", { count: productsRes.meta.total })}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("noProducts")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Simple pagination — prev/next only, no filter chips */}
        {productsRes.meta.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/qafila-lab/${slug}?page=${page - 1}`}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-dark transition hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-500/60 dark:hover:text-amber-300"
              >
                {t("prev")}
              </Link>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("pageOf", {
                page,
                total: productsRes.meta.totalPages,
              })}
            </span>
            {page < productsRes.meta.totalPages && (
              <Link
                href={`/qafila-lab/${slug}?page=${page + 1}`}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-dark transition hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-500/60 dark:hover:text-amber-300"
              >
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
