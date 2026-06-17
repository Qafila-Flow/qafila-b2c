import { getLocale, setRequestLocale } from "next-intl/server";

// ISR: refresh homepage every 60s so newly-flagged Qafila Lab vendors and
// recommendation lists pick up without waiting for a full rebuild.
export const revalidate = 60;
import HeroBanner from "@/components/home/HeroBanner";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import RecommendedBanner from "@/components/home/RecommendedBanner";
import SaudiMadeBanner from "@/components/home/SaudiMadeBanner";
import QafilaLabSection from "@/components/home/QafilaLabSection";
import BestSeller from "@/components/home/BestSeller";
import SellCta from "@/components/home/SellCta";
import AppDownload from "@/components/home/AppDownload";
import { getForYou, getBestSellers } from "@/lib/api/recommendations";
import { getQafilaLabVendors, type VendorProfile } from "@/lib/api/vendors";
import { getActiveBanners, type Banner } from "@/lib/api/banners";
import { getProducts, type ApiProduct } from "@/lib/api/products";
import type { RecommendationProduct } from "@/types/product";
import type { Product } from "@/components/shared/ProductCard";
import { getMediaUrl } from "@/lib/utils";

function mapProduct(item: RecommendationProduct, locale: string): Product {
  const hasSale = item.salePrice != null && item.salePrice < item.price;
  const displayPrice = hasSale ? item.salePrice! : item.price;
  const originalPrice = hasSale ? item.price : null;
  const discount = hasSale
    ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
    : null;

  const name =
    locale === "ar"
      ? item.brand?.nameAr || item.brand?.name || item.titleAr || item.title
      : item.brand?.name || item.title;

  const description = locale === "ar" ? item.titleAr || item.title : item.title;

  return {
    id: item.id,
    name,
    description,
    price: displayPrice,
    originalPrice,
    discount,
    rating: item.averageRating,
    reviews: item.reviewCount,
    trending: item.isFeatured,
    badge: hasSale ? `${discount}%` : null,
    image: item.imageUrl,
    slug: item.slug,
    tags: item.tags ?? [],
  };
}

// Maps a full ApiProduct (from /products) — the Saudi-Made banner pulls from
// the products endpoint filtered by tag, not the recommendations feed.
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let forYouProducts: Product[] = [];
  let bestSellerProducts: Product[] = [];
  let saudiMadeProducts: Product[] = [];
  let qafilaLabVendors: VendorProfile[] = [];
  let banners: Banner[] = [];

  try {
    const [forYouRes, bestSellersRes, saudiMadeRes, qafilaLabRes, bannersRes] =
      await Promise.all([
        getForYou({ limit: 10 }),
        getBestSellers({ limit: 10 }),
        getProducts({ tags: ["SAUDI_MADE"], limit: 10 }).catch(() => ({
          data: [] as ApiProduct[],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        })),
        getQafilaLabVendors({ limit: 8 }).catch(() => ({ vendors: [] })),
        getActiveBanners().catch(() => [] as Banner[]),
      ]);
    forYouProducts = forYouRes.data.map((item) => mapProduct(item, locale));
    bestSellerProducts = bestSellersRes.data.map((item) =>
      mapProduct(item, locale),
    );
    saudiMadeProducts = saudiMadeRes.data.map((item) =>
      mapApiProduct(item, locale),
    );
    qafilaLabVendors = qafilaLabRes.vendors ?? [];
    banners = bannersRes;
  } catch {
    // API unavailable — sections will render empty gracefully
  }

  return (
    <>
      <HeroBanner banners={banners} />
      <CategoryCarousel />
      <RecommendedBanner products={forYouProducts} />
      <SaudiMadeBanner products={saudiMadeProducts} />
      <QafilaLabSection vendors={qafilaLabVendors} locale={locale} />
      <BestSeller products={bestSellerProducts} />
      <AppDownload />
      <SellCta />
    </>
  );
}
