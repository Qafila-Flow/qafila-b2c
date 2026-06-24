import apiClient from "./client";
import type { PaginatedResponse } from "./types";
import type { ApiReview, GetReviewsParams } from "./reviews";

// Vendor endpoints are NOT under /v1, so override baseURL
const VENDOR_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface VendorProfile {
  id: string;
  userId: string;
  storeName: string;
  storeNameAr: string;
  slug: string;
  description?: string | null;
  descriptionAr?: string | null;
  logo?: string | null;
  banner?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isQafilaLab: boolean;
  qafilaLabType?: "DESIGNER" | "MANUFACTURER" | null;
  followerCount: number;
  productCount: number;
  rating?: number | null;
  reviewCount: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QafilaLabVendorList {
  vendors: VendorProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getVendorBySlug(slug: string): Promise<VendorProfile> {
  try {
    return apiClient.get(`/vendors/slug/${slug}`, { baseURL: VENDOR_BASE });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getQafilaLabVendors(params?: {
  page?: number;
  limit?: number;
}): Promise<QafilaLabVendorList> {
  return apiClient.get(`/vendors/qafila-lab`, {
    baseURL: VENDOR_BASE,
    params,
  });
}

export async function followVendor(
  vendorId: string,
): Promise<{ message: string }> {
  return apiClient.post(`/vendors/${vendorId}/follow`, null, {
    baseURL: VENDOR_BASE,
  });
}

export async function unfollowVendor(
  vendorId: string,
): Promise<{ message: string }> {
  return apiClient.delete(`/vendors/${vendorId}/follow`, {
    baseURL: VENDOR_BASE,
  });
}

export async function getVendorReviews(
  vendorId: string,
  params?: GetReviewsParams,
): Promise<PaginatedResponse<ApiReview>> {
  return apiClient.get(`/reviews/vendor/${vendorId}`, { params });
}
