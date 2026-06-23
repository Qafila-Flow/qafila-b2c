import apiClient from "./client";

export type PlanSegment =
  | "INDIVIDUAL"
  | "BUSINESS"
  | "GOVERNMENT"
  | "VENDOR";

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  segment: PlanSegment;
  tier: number;
  priceMonthly: number;
  priceAnnually: number;
  currency: string;
  features: Record<string, unknown>;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPlans {
  data: SubscriptionPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanQueryParams {
  segment?: PlanSegment;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPlans(params?: PlanQueryParams): Promise<PaginatedPlans> {
  return apiClient.get("/plans", { params });
}

export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan> {
  return apiClient.get(`/plans/${slug}`);
}
