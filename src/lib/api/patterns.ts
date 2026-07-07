import apiClient from "./client";
import type { PaginatedResponse } from "./types";
import type { Pattern } from "@/types/filters";

export interface GetPatternsParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  // Restrict to patterns scoped to this category (plus global patterns)
  categoryId?: string;
}

export async function getPatterns(
  params?: GetPatternsParams,
): Promise<PaginatedResponse<Pattern>> {
  return apiClient.get("/patterns", { params });
}
