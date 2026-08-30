import apiClient from "./client";

export interface RequestOtpPayload {
  phoneNumber: string;
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otp: string;
}

export interface User {
  id: string;
  /** null for accounts created through Google sign-in that have not added one yet. */
  phoneNumber: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  gender?: "MALE" | "FEMALE";
  birthDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  isNewUser: boolean;
  /** True when the account has no phone yet. Checkout needs one. */
  requiresPhone: boolean;
}

export interface GoogleLoginPayload {
  /** The `credential` field from the Google Identity Services callback. */
  idToken: string;
}

export async function requestOtp(payload: RequestOtpPayload): Promise<void> {
  await apiClient.post("/auth/otp/request", payload);
}

export async function verifyOtp(
  payload: VerifyOtpPayload,
): Promise<AuthResponse> {
  return apiClient.post("/auth/otp/verify", payload);
}

export async function googleLogin(
  payload: GoogleLoginPayload,
): Promise<AuthResponse> {
  return apiClient.post("/auth/google", payload);
}

/**
 * Attach a phone to the signed-in account.
 *
 * Deliberately not `requestOtp` - that endpoint creates an account when the
 * number is unknown, which would split a Google customer across two records.
 */
export async function requestPhoneOtp(
  payload: RequestOtpPayload,
): Promise<void> {
  await apiClient.post("/auth/phone/request", payload);
}

export async function verifyPhoneOtp(
  payload: VerifyOtpPayload,
): Promise<AuthResponse> {
  return apiClient.post("/auth/phone/verify", payload);
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
