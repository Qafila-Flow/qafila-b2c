import { setRequestLocale, getTranslations } from "next-intl/server";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct } from "@/lib/api/products";
import { getBrands } from "@/lib/api/brands";
import { getColors } from "@/lib/api/colors";
import { getSizes } from "@/lib/api/sizes";
import { getMaterials } from "@/lib/api/materials";
import { getPatterns } from "@/lib/api/patterns";
import { getPriceRanges } from "@/lib/api/price-ranges";
import { getMediaUrl } from "@/lib/utils";
import CategoryPageClient from "@/components/category/CategoryPageClient";
import type { Product } from "@/components/shared/ProductCard";
import type { FilterOptions } from "@/types/filters";

const EMPTY_LIST = {
  data: [],
  meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
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
  const imageUrl = item.images?.[0]?.url ? getMediaUrl(item.images[0].url) : null;

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
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("search");
  const query = typeof sp.q === "string" ? sp.q.trim() : "";

  // Build product query params from URL search params
  const productParams: Record<string, unknown> = {
    page: sp.page ? Number(sp.page) : 1,
    limit: 24,
  };
  if (query) productParams.search = query;
  if (sp.brandId) productParams.brandId = String(sp.brandId);
  if (sp.colorId) productParams.colorId = String(sp.colorId);
  if (sp.sizeId) productParams.sizeId = String(sp.sizeId);
  if (sp.materialId) productParams.materialId = String(sp.materialId);
  if (sp.patternId) productParams.patternId = String(sp.patternId);
  if (sp.categoryId) productParams.categoryId = String(sp.categoryId);
  if (sp.minPrice) productParams.minPrice = Number(sp.minPrice);
  if (sp.maxPrice) productParams.maxPrice = Number(sp.maxPrice);
  if (sp.onSale === "true") productParams.onSale = true;
  if (sp.sortBy) productParams.sortBy = String(sp.sortBy);
  if (sp.sortOrder) productParams.sortOrder = String(sp.sortOrder);

  const [
    brandsRes,
    colorsRes,
    sizesRes,
    materialsRes,
    patternsRes,
    priceRangesRes,
    productsRes,
  ] = await Promise.all([
    getBrands({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getColors({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getSizes({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getMaterials({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getPatterns({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getPriceRanges({ isActive: true, limit: 100 }).catch(() => EMPTY_LIST),
    getProducts(productParams).catch(() => ({
      data: [] as ApiProduct[],
      meta: { total: 0, page: 1, limit: 24, totalPages: 0 },
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

  const title = query ? t("resultsFor", { query }) : t("allProducts");

  return (
    <div className="mx-auto max-w-360 px-4 pb-12 pt-4 sm:px-6">
      <CategoryPageClient
        categoryName={title}
        products={products}
        pagination={productsRes.meta}
        filterOptions={filterOptions}
      />
    </div>
  );
}
