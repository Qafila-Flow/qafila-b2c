import type { ProductTag } from "@/lib/api/products";

export interface RecommendationProduct {
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
  tags?: ProductTag[];
  category: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
  } | null;
  score?: number;
  reason?: string;
}

export interface RecommendationMeta {
  total: number;
  type: string;
  generatedAt: string;
}

export interface RecommendationResponse {
  data: RecommendationProduct[];
  meta: RecommendationMeta;
}
