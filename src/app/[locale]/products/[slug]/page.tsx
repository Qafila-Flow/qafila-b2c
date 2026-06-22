import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySlug } from "@/lib/api/products";
import type { ApiProduct } from "@/lib/api/products";
import { getProductReviews, getReviewStats } from "@/lib/api/reviews";
import { getCategoryBreadcrumb } from "@/lib/api/categories";
import { getForYou } from "@/lib/api/recommendations";
import { getMediaUrl } from "@/lib/utils";
import Breadcrumb from "@/components/category/Breadcrumb";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import type { Product } from "@/components/shared/ProductCard";
import type { ReviewData } from "@/components/product/ReviewCard";
import type { ColorVariant } from "@/components/product/ColorSelector";
import type { SizeOption } from "@/components/product/SizeSelector";

function getLocalizedField<T extends Record<string, unknown>>(
  obj: T | null,
  locale: string,
): string | null {
  if (!obj) return null;
  return locale === "ar"
    ? (obj.nameAr as string) || (obj.name as string)
    : (obj.name as string);
}

function mapRecommendation(
  item: {
    id: string;
    title: string;
    titleAr: string;
    slug: string;
    price: number;
    salePrice: number | null;
    imageUrl: string | null;
    averageRating: number;
    reviewCount: number;
    isFeatured: boolean;
    brand: { name: string; nameAr: string } | null;
  },
  locale: string,
): Product {
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
    image: getMediaUrl(item.imageUrl),
    slug: item.slug,
  };
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Fetch product — 404 if not found
  let product: ApiProduct;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const title =
    locale === "ar" ? product.titleAr || product.title : product.title;
  const description =
    locale === "ar"
      ? product.descriptionAr || product.description
      : product.description;

  // Parallel fetches
  const [breadcrumbRes, statsRes, reviewsRes, recommendedRes] =
    await Promise.all([
      product.category
        ? getCategoryBreadcrumb(product.category.id).catch(() => [])
        : Promise.resolve([]),
      getReviewStats(product.id).catch(() => ({
        averageRating: Number(product.averageRating),
        totalReviews: product.reviewCount,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
          1 | 2 | 3 | 4 | 5,
          number
        >,
      })),
      getProductReviews(product.id, { page: 1, limit: 5 }).catch(() => ({
        data: [],
        meta: { total: 0, page: 1, limit: 5, totalPages: 0 },
      })),
      getForYou({
        limit: 10,
        categoryId: product.category?.id,
      }).catch(() => ({
        data: [],
        meta: { total: 0, type: "", generatedAt: "" },
      })),
    ]);

  // Build color variants from product.colors[]
  const defaultColor = product.colors?.find((c) => c.isDefault);
  const colors: ColorVariant[] = (product.colors || []).map((pc) => {
    // Find the image linked to this productColor
    const colorImage = product.images?.find(
      (img) => img.productColorId === pc.id,
    );
    return {
      id: pc.color.id,
      name: locale === "ar" ? pc.color.nameAr || pc.color.name : pc.color.name,
      hexCode: pc.color.hexCode,
      image: colorImage ? (getMediaUrl(colorImage.url) ?? null) : null,
      slug: product.slug,
    };
  });

  // Build size options from product.sizes[], aggregate stock from variants
  const sizes: SizeOption[] = (product.sizes || []).map((ps) => {
    // Sum quantity from all variants that match this productSizeId
    const stock = (product.variants || [])
      .filter((v) => v.productSizeId === ps.id)
      .reduce((sum, v) => sum + v.quantity, 0);
    return {
      id: ps.size.id,
      name: locale === "ar" ? ps.size.nameAr || ps.size.name : ps.size.name,
      stock,
    };
  });

  // Build variant info + ID mapping for add-to-cart
  const variants = (product.variants || []).map((v) => ({
    id: v.id,
    productColorId: v.productColorId,
    productSizeId: v.productSizeId,
  }));

  // color.id (UI) → productColor.id (variant lookup)
  const colorIdToProductColorId: Record<string, string> = {};
  for (const pc of product.colors || []) {
    colorIdToProductColorId[pc.color.id] = pc.id;
  }

  // size.id (UI) → productSize.id (variant lookup)
  const sizeIdToProductSizeId: Record<string, string> = {};
  for (const ps of product.sizes || []) {
    sizeIdToProductSizeId[ps.size.id] = ps.id;
  }

  // Resolve images
  const images = (product.images || []).map((img) => ({
    id: img.id,
    url: getMediaUrl(img.url) || img.url,
    alt: img.alt,
  }));

  // Map reviews
  const reviewData: ReviewData[] = reviewsRes.data.map((r) => ({
    id: r.id,
    userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
    userAvatar: null,
    userId: r.user.id,
    rating: r.rating,
    title: r.title,
    comment: r.content || "",
    isVerifiedPurchase: r.isVerifiedPurchase,
    helpfulCount: r.helpfulCount,
    hasLiked: r.hasLiked,
    commentCount: r.commentCount,
    createdAt: r.createdAt,
    media: (r.media || []).map((m) => ({
      id: m.id,
      url: getMediaUrl(m.url) || m.url,
      alt: m.alt,
      type: m.type || "IMAGE",
      duration: m.duration,
      thumbnailUrl: m.thumbnailUrl,
    })),
  }));

  // Map recommended products
  const recommended: Product[] = recommendedRes.data.map((item) =>
    mapRecommendation(item, locale),
  );

  // Price calculations (API returns strings)
  const price = Number(product.price);
  const salePrice =
    product.salePrice != null ? Number(product.salePrice) : null;
  const hasSale = salePrice != null && salePrice < price;
  const displayPrice = hasSale ? salePrice! : price;
  const originalPrice = hasSale ? price : null;
  const discount = hasSale
    ? Math.round(((price - salePrice!) / price) * 100)
    : null;

  // Breadcrumb
  const breadcrumb = Array.isArray(breadcrumbRes) ? breadcrumbRes : [];

  return (
    <div className="mx-auto max-w-360 px-4 pb-12 sm:px-6">
      <Breadcrumb breadcrumb={breadcrumb} currentName={title} />

      <ProductDetailClient
        product={{
          id: product.id,
          title,
          description,
          price: displayPrice,
          originalPrice,
          discount,
          stock: product.quantity,
          sku: product.sku,
          averageRating: Number(product.averageRating),
          reviewCount: product.reviewCount,
          images,
          brand: getLocalizedField(product.brand, locale),
          material: getLocalizedField(product.material, locale),
          pattern: getLocalizedField(product.pattern, locale),
          tags: product.tags ?? [],
        }}
        colors={colors}
        sizes={sizes}
        variants={variants}
        colorIdToProductColorId={colorIdToProductColorId}
        sizeIdToProductSizeId={sizeIdToProductSizeId}
        initialSelectedColorId={defaultColor?.color.id ?? null}
        reviewStats={{
          averageRating: statsRes.averageRating,
          totalReviews: statsRes.totalReviews,
          distribution: statsRes.ratingDistribution,
        }}
        initialReviews={reviewData}
        hasMoreReviews={reviewsRes.meta.page < reviewsRes.meta.totalPages}
        recommended={recommended}
        vendor={
          product.vendor
            ? {
                id: product.vendor.id,
                storeName:
                  locale === "ar"
                    ? product.vendor.storeNameAr || product.vendor.storeName
                    : product.vendor.storeName,
                slug: product.vendor.slug,
                logo: getMediaUrl(product.vendor.logo),
                averageRating:
                  product.vendor.rating != null
                    ? Number(product.vendor.rating)
                    : undefined,
                reviewCount: product.vendor.reviewCount,
                isVerified: product.vendor.isVerified,
                followersCount: product.vendor.followerCount,
                isFollowing: product.vendor.isFollowing,
              }
            : null
        }
      />
    </div>
  );
}
