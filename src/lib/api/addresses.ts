import apiClient from "./client";
import type { SaudiRegionCode } from "./cities";

export type AddressType = "HOME" | "WORK" | "OTHER";

export interface Address {
  id: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  street: string;
  /** Canonical name once resolved; otherwise whatever the user originally typed. */
  city: string;
  /** Null on legacy addresses saved before the city list existed. */
  cityId: string | null;
  cityNameEn: string | null;
  cityNameAr: string | null;
  region: SaudiRegionCode | null;
  regionNameEn: string | null;
  regionNameAr: string | null;
  area: string;
  apartmentNo?: string;
  directions?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressListResponse {
  addresses: Address[];
  total: number;
  defaultAddress: Address | null;
}

export interface CreateAddressPayload {
  type?: AddressType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  street: string;
  /**
   * Canonical city id from GET /cities. Send this — it is what places the
   * address on the admin distribution map. The region is derived server-side.
   */
  cityId?: string;
  /**
   * Free-text city name. Deprecated; still sent alongside cityId so anything
   * reading the raw payload keeps working during the transition.
   */
  city?: string;
  area: string;
  apartmentNo?: string;
  directions?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export async function getAddresses(): Promise<AddressListResponse> {
  return apiClient.get("/addresses");
}

export async function getAddressById(id: string): Promise<Address> {
  return apiClient.get(`/addresses/${id}`);
}

export async function getDefaultAddress(): Promise<Address> {
  return apiClient.get("/addresses/default");
}

export async function createAddress(
  payload: CreateAddressPayload,
): Promise<Address> {
  return apiClient.post("/addresses", payload);
}

export async function updateAddress(
  id: string,
  payload: UpdateAddressPayload,
): Promise<Address> {
  return apiClient.put(`/addresses/${id}`, payload);
}

export async function deleteAddress(id: string): Promise<void> {
  return apiClient.delete(`/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<Address> {
  return apiClient.put(`/addresses/${id}/set-default`);
}
