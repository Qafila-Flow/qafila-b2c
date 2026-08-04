import apiClient from "./client";

/** The 13 administrative regions of Saudi Arabia. */
export type SaudiRegionCode =
  | "RIYADH"
  | "MAKKAH"
  | "MADINAH"
  | "EASTERN_PROVINCE"
  | "QASSIM"
  | "HAIL"
  | "TABUK"
  | "NORTHERN_BORDERS"
  | "JAZAN"
  | "NAJRAN"
  | "AL_BAHAH"
  | "AL_JAWF"
  | "ASIR";

export interface City {
  id: string;
  nameEn: string;
  nameAr: string;
  region: SaudiRegionCode;
  latitude: number | null;
  longitude: number | null;
}

export interface RegionWithCities {
  code: SaudiRegionCode;
  isoCode: string;
  nameEn: string;
  nameAr: string;
  cities: City[];
}

export interface CitiesResponse {
  regions: RegionWithCities[];
  totalCities: number;
}

/**
 * The region → city tree is effectively static: the same ~130 rows on every
 * request, changing only when an admin edits the list. Fetching it once per
 * page load would be pure waste, so the in-flight promise is memoised for the
 * lifetime of the tab.
 *
 * A rejected request clears the cache, otherwise one network blip would leave
 * every later caller stuck with the same failure.
 */
let citiesPromise: Promise<CitiesResponse> | null = null;

export async function getCities(): Promise<CitiesResponse> {
  if (!citiesPromise) {
    citiesPromise = apiClient
      .get<unknown, CitiesResponse>("/cities")
      .catch((error) => {
        citiesPromise = null;
        throw error;
      });
  }
  return citiesPromise;
}

/** Bilingual display name for a city or region. */
export function localizedName(
  entry: { nameEn: string; nameAr: string },
  locale: string,
): string {
  return locale === "ar" ? entry.nameAr : entry.nameEn;
}
