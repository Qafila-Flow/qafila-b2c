import apiClient from "./client";
import type { PaginatedResponse } from "./types";
import type { Brand } from "@/types/filters";

export interface GetBrandsParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  // Restrict to brands scoped to this category (plus global brands)
  categoryId?: string;
}

export async function getBrands(
  params?: GetBrandsParams,
): Promise<PaginatedResponse<Brand>> {
  return apiClient.get("/brands", { params });
}
