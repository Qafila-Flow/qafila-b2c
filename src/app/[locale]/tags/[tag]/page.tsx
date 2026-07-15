import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PackageSearch, Crown, Gem, BadgeCheck } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct, ProductTag } from "@/lib/api/products";
import { getMediaUrl } from "@/lib/utils";
import ProductCard, { type Product } from "@/components/shared/ProductCard";
import { Link } from "@/i18n/navigation";

const SLUG_TO_TAG: Record<string, ProductTag> = {
  "limited-editions": "LIMITED_EDITIONS",
  luxuries: "LUXURIES",
  "saudi-made": "SAUDI_MADE",
};

const TAG_THEME: Record<
  ProductTag,
  {
    icon: typeof Crown;
    gradient: string;
    glow: string;
    titleKey: "limitedEditions" | "luxuries" | "saudiMade";
    /** Hero banner image. Drop the real asset at this path in
     * `public/images/`; until then the `bannerGradient` shows through. */
    banner: string;
    /** Gradient base behind the banner image — acts as a placeholder
     * before the image is added and as the scrim tint after. */
    bannerGradient: string;
  }
> = {
  LIMITED_EDITIONS: {
    icon: Crown,
    gradient: "from-amber-500 to-amber-600",
    glow: "shadow-amber-500/30",
    titleKey: "limitedEditions",
    banner: "/images/limited-editions-bg.jpeg",
    bannerGradient: "from-[#e8983a] via-[#d67e2e] to-[#c96a25]",
  },
  LUXURIES: {
    icon: Gem,
    gradient: "from-violet-600 to-fuchsia-600",
    glow: "shadow-violet-500/30",
    titleKey: "luxuries",
    banner: "/images/luxuries-bg.jpeg",
    bannerGradient: "from-neutral-900 via-neutral-800 to-neutral-700",
  },
  SAUDI_MADE: {
    icon: BadgeCheck,
    gradient: "from-green-700 to-green-900",
    glow: "shadow-green-800/30",
    titleKey: "saudiMade",
    banner: "/images/sa-bg.png",
    bannerGradient: "from-[#4A4035] via-[#5A5045] to-[#706558]",
  },
};

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

  const description = locale === "ar" ? item.titleAr || item.title : item.title;

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
  params: Promise<{ locale: string; tag: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  const productTag = SLUG_TO_TAG[tag.toLowerCase()];
  if (!productTag) return {};
  const t = await getTranslations("productTagPage");
  const label = await getTranslations("productTag");
  return {
    title: t("metaTitle", { tag: label(TAG_THEME[productTag].titleKey) }),
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { locale, tag } = await params;
  setRequestLocale(locale);

  const productTag = SLUG_TO_TAG[tag.toLowerCase()];
  if (!productTag) notFound();

  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;
  const limit = 24;

  const t = await getTranslations("productTagPage");
  const label = await getTranslations("productTag");
  const theme = TAG_THEME[productTag];
  const tagName = label(theme.titleKey);

  const productsRes = await getProducts({
    tags: [productTag],
    page,
    limit,
  }).catch(() => ({
    data: [] as ApiProduct[],
    meta: { total: 0, page: 1, limit, totalPages: 0 },
  }));

  const products: Product[] = productsRes.data.map((item) =>
    mapApiProduct(item, locale),
  );

  const { total, totalPages } = productsRes.meta;
  const buildPageHref = (p: number) =>
    `/tags/${tag}${p > 1 ? `?page=${p}` : ""}`;

  return (
    <div className="mx-auto max-w-360 px-4 pb-12 sm:px-6">
      {/* Hero — banner image over a gradient base. The gradient acts as a
          placeholder until each tag's `banner` asset is added to public/images. */}
      <div className="relative my-6 flex h-44 w-full items-center overflow-hidden rounded-2xl sm:h-56">
        <div
          className={`absolute inset-0 bg-linear-to-r ${theme.bannerGradient}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.banner}
          alt={tagName}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 px-6 sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {tagName}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {t("subtitle", { count: total })}
          </p>
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
          <PackageSearch
            size={48}
            className="mb-4 text-gray-400 dark:text-gray-500"
          />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("emptyTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} variant="grid" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === page;
            return (
              <Link
                key={p}
                href={buildPageHref(p)}
                className={`min-w-8 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm`
                    : "border border-gray-200 text-gray-text hover:border-gray-300 hover:text-dark dark:border-gray-700 dark:hover:text-gray-100"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
