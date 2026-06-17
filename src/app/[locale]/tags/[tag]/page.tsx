import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PackageSearch, Crown, Gem, Award, BadgeCheck } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct, ProductTag } from "@/lib/api/products";
import { getMediaUrl } from "@/lib/utils";
import ProductCard, { type Product } from "@/components/shared/ProductCard";
import { Link } from "@/i18n/navigation";

const SLUG_TO_TAG: Record<string, ProductTag> = {
  "limited-editions": "LIMITED_EDITIONS",
  luxuries: "LUXURIES",
  originals: "ORIGINALS",
  "saudi-made": "SAUDI_MADE",
};

const TAG_THEME: Record<
  ProductTag,
  {
    icon: typeof Crown;
    gradient: string;
    glow: string;
    titleKey: "limitedEditions" | "luxuries" | "originals" | "saudiMade";
  }
> = {
  LIMITED_EDITIONS: {
    icon: Crown,
    gradient: "from-amber-500 to-amber-600",
    glow: "shadow-amber-500/30",
    titleKey: "limitedEditions",
  },
  LUXURIES: {
    icon: Gem,
    gradient: "from-violet-600 to-fuchsia-600",
    glow: "shadow-violet-500/30",
    titleKey: "luxuries",
  },
  ORIGINALS: {
    icon: Award,
    gradient: "from-emerald-600 to-teal-600",
    glow: "shadow-emerald-500/30",
    titleKey: "originals",
  },
  SAUDI_MADE: {
    icon: BadgeCheck,
    gradient: "from-green-700 to-green-900",
    glow: "shadow-green-800/30",
    titleKey: "saudiMade",
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
  const Icon = theme.icon;
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
  const buildPageHref = (p: number) => `/tags/${tag}${p > 1 ? `?page=${p}` : ""}`;

  return (
    <div className="mx-auto max-w-360 px-4 pb-12 sm:px-6">
      {/* Hero */}
      <div className="relative my-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-dark">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10`}
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg ${theme.glow}`}
          >
            <Icon size={28} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-text">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-dark dark:text-gray-100 sm:text-3xl">
              {tagName}
            </h1>
            <p className="mt-1 text-sm text-gray-text">
              {t("subtitle", { count: total })}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
          <PackageSearch size={48} className="mb-4 text-gray-border" />
          <h3 className="text-base font-semibold text-dark dark:text-gray-100">
            {t("emptyTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-text">{t("emptyBody")}</p>
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
