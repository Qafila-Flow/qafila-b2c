import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getVendorBySlug, getVendorReviews } from "@/lib/api/vendors";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct } from "@/lib/api/products";
import { getBrands } from "@/lib/api/brands";
import { getColors } from "@/lib/api/colors";
import { getSizes } from "@/lib/api/sizes";
import { getMaterials } from "@/lib/api/materials";
import { getPatterns } from "@/lib/api/patterns";
import { getPriceRanges } from "@/lib/api/price-ranges";
import { getMediaUrl } from "@/lib/utils";
import VendorPageClient from "@/components/vendor/VendorPageClient";
import type { Product } from "@/components/shared/ProductCard";
import type { FilterOptions } from "@/types/filters";

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
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VendorPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;

  // Fetch vendor — 404 if not found
  let vendor;
  try {
    vendor = await getVendorBySlug(slug);
  } catch (error) {
    console.log(error);
    notFound();
  }

  // Build product query params from URL search params
  const productParams: Record<string, unknown> = {
    vendorId: vendor.id,
    page: sp.page ? Number(sp.page) : 1,
    limit: 24,
  };

  if (sp.brandId) productParams.brandId = String(sp.brandId);
  if (sp.colorId) productParams.colorId = String(sp.colorId);
  if (sp.sizeId) productParams.sizeId = String(sp.sizeId);
  if (sp.materialId) productParams.materialId = String(sp.materialId);
  if (sp.patternId) productParams.patternId = String(sp.patternId);
  if (sp.minPrice) productParams.minPrice = Number(sp.minPrice);
  if (sp.maxPrice) productParams.maxPrice = Number(sp.maxPrice);
  if (sp.onSale === "true") productParams.onSale = true;
  if (sp.sortBy) productParams.sortBy = String(sp.sortBy);
  if (sp.sortOrder) productParams.sortOrder = String(sp.sortOrder);
  if (sp.search) productParams.search = String(sp.search);

  // Fetch all data in parallel
  const [
    brandsRes,
    colorsRes,
    sizesRes,
    materialsRes,
    patternsRes,
    priceRangesRes,
    productsRes,
    reviewsRes,
  ] = await Promise.all([
    getBrands({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getColors({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getSizes({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getMaterials({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getPatterns({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getPriceRanges({ isActive: true, limit: 100 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
    getProducts(productParams).catch(() => ({
      data: [] as ApiProduct[],
      meta: { total: 0, page: 1, limit: 24, totalPages: 0 },
    })),
    getVendorReviews(vendor.id, { page: 1, limit: 10 }).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })),
  ]);

  const products: Product[] = productsRes.data.map((item) =>
    mapApiProduct(item, locale),
  );

  const filterOptions: FilterOptions = {
    brands: brandsRes.data,
    colors: colorsRes.data,
    sizes: sizesRes.data,
    materials: materialsRes.data,
    patterns: patternsRes.data,
    priceRanges: priceRangesRes.data,
    subcategories: [],
  };

  return (
    <div className="mx-auto max-w-360 px-4 pb-12 sm:px-6">
      <VendorPageClient
        vendor={vendor}
        locale={locale}
        products={products}
        pagination={productsRes.meta}
        filterOptions={filterOptions}
        initialReviews={reviewsRes.data}
        reviewsPagination={reviewsRes.meta}
      />
    </div>
  );
}
