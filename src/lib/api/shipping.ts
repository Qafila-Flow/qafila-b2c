import apiClient from "./client";

export interface ResolvedAddress {
  buildingNumber: string | null;
  additionalNumber: string | null;
  postalCode: string | null;
  street: string | null;
  district: string | null;
  city: string | null;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  line1: string | null;
  line2: string | null;
}

export type LookupUnavailableReason =
  | "NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "UPSTREAM_ERROR";

export interface AddressSearchResponse {
  available: boolean;
  results: ResolvedAddress[];
  reason?: LookupUnavailableReason;
}

/**
 * Resolve a Saudi National Address.
 *
 * Call this on an explicit press, never on every keystroke. The upstream
 * account allows only a handful of calls per minute across the whole platform,
 * so a search-as-you-type field would exhaust the budget for every customer.
 *
 * Never throws for an unavailable upstream: check `available` and fall back to
 * plain manual entry, because a failing lookup must not block checkout.
 */
export async function searchAddress(
  q: string,
  locale: "en" | "ar" = "en",
): Promise<AddressSearchResponse> {
  return apiClient.get("/shipping/address/search", { params: { q, locale } });
}
