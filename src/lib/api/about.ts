import apiClient from "./client";
import type { AboutPage } from "@/types/about";

// The shared client's response interceptor already unwraps `response.data`,
// so this resolves to the AboutPage payload directly.
export async function getAbout(): Promise<AboutPage> {
  return apiClient.get("/about");
}
