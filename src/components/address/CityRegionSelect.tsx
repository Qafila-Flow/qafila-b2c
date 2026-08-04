"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, Search, X } from "lucide-react";
import {
  getCities,
  localizedName,
  type City,
  type RegionWithCities,
  type SaudiRegionCode,
} from "@/lib/api/cities";

interface CityRegionSelectProps {
  /** Currently selected city id, or null. */
  value: string | null;
  onChange: (cityId: string | null, city: City | null) => void;
  /**
   * Free text stored on a legacy address that has no cityId. Shown as a hint so
   * the user understands why nothing is preselected and what they had before.
   */
  legacyCityName?: string | null;
  required?: boolean;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-start text-sm text-dark dark:text-gray-200 outline-none transition-colors focus:border-dark disabled:opacity-50";

/**
 * Region → city picker.
 *
 * Replaces the free-text city input. Two dependent selects rather than one flat
 * list of ~130 cities: picking a region cuts the city list to a handful, and the
 * region is the unit the admin heat map is drawn in, so choosing it first
 * matches how the data is actually used.
 *
 * The city list is searchable because a bare <select> with 130 options is
 * unusable on mobile, which is where most of these addresses get typed.
 */
export default function CityRegionSelect({
  value,
  onChange,
  legacyCityName,
  required = false,
  disabled = false,
}: CityRegionSelectProps) {
  const t = useTranslations("addresses");
  const locale = useLocale();

  const [regions, setRegions] = useState<RegionWithCities[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [regionCode, setRegionCode] = useState<SaudiRegionCode | "">("");
  const [cityOpen, setCityOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getCities()
      .then((data) => {
        if (!cancelled) {
          setRegions(data.regions);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When editing an existing address, jump the region select to whichever
  // region owns the selected city, so the form opens in a consistent state.
  useEffect(() => {
    if (!value || regions.length === 0) return;
    const owning = regions.find((r) => r.cities.some((c) => c.id === value));
    if (owning) setRegionCode(owning.code);
  }, [value, regions]);

  // Close the city dropdown on an outside click.
  useEffect(() => {
    if (!cityOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [cityOpen]);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.code === regionCode) ?? null,
    [regions, regionCode],
  );

  const selectedCity = useMemo(() => {
    if (!value) return null;
    for (const region of regions) {
      const match = region.cities.find((c) => c.id === value);
      if (match) return match;
    }
    return null;
  }, [regions, value]);

  const visibleCities = useMemo(() => {
    if (!selectedRegion) return [];
    const term = search.trim().toLowerCase();
    if (!term) return selectedRegion.cities;
    // Match either language regardless of the UI locale — people type city
    // names in whichever script is on their keyboard.
    return selectedRegion.cities.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(term) || c.nameAr.includes(search.trim()),
    );
  }, [selectedRegion, search]);

  const handleRegionChange = (code: string) => {
    setRegionCode(code as SaudiRegionCode | "");
    setSearch("");
    // The previously chosen city belongs to the old region, so clear it rather
    // than leave a city displayed that isn't in the list any more.
    if (value) onChange(null, null);
  };

  const handleCityPick = (city: City) => {
    onChange(city.id, city);
    setCityOpen(false);
    setSearch("");
  };

  if (loadError) {
    // Never dead-end the user: if the city list can't load, say so rather than
    // leaving two selects that silently do nothing.
    return (
      <p className="rounded-lg border border-discount/40 bg-discount/5 px-4 py-3 text-xs text-discount">
        {t("cityListUnavailable")}
      </p>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Region */}
      <div className="relative">
        <select
          value={regionCode}
          onChange={(e) => handleRegionChange(e.target.value)}
          required={required}
          disabled={disabled || loading}
          className={`${inputClass} appearance-none pe-10`}
          aria-label={t("region")}
        >
          <option value="">
            {loading ? t("loading") : `${t("selectRegion")}${required ? "*" : ""}`}
          </option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {localizedName(region, locale)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-gray-text"
        />
      </div>

      {/* City */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setCityOpen((open) => !open)}
          disabled={disabled || !selectedRegion}
          className={`${inputClass} flex items-center justify-between gap-2`}
          aria-haspopup="listbox"
          aria-expanded={cityOpen}
          aria-label={t("city")}
        >
          <span
            className={selectedCity ? "" : "text-gray-text dark:text-gray-500"}
          >
            {selectedCity
              ? localizedName(selectedCity, locale)
              : !selectedRegion
                ? t("selectRegionFirst")
                : `${t("selectCity")}${required ? "*" : ""}`}
          </span>
          <ChevronDown size={16} className="shrink-0 text-gray-text" />
        </button>

        {cityOpen && selectedRegion && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-border bg-white shadow-lg dark:border-gray-700 dark:bg-dark">
            <div className="relative border-b border-gray-border dark:border-gray-700">
              <Search
                size={14}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-text"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchCity")}
                autoFocus
                className="w-full bg-transparent px-9 py-2.5 text-sm text-dark outline-none placeholder:text-gray-text dark:text-gray-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-dark"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {visibleCities.length === 0 ? (
                <li className="px-4 py-3 text-center text-xs text-gray-text">
                  {t("noCitiesFound")}
                </li>
              ) : (
                visibleCities.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={city.id === value}
                      onClick={() => handleCityPick(city)}
                      className={`w-full px-4 py-2.5 text-start text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        city.id === value
                          ? "font-medium text-primary"
                          : "text-dark dark:text-gray-200"
                      }`}
                    >
                      {localizedName(city, locale)}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Legacy address hint — explains an empty picker on an address that
          already has a city name stored as free text. */}
      {!value && legacyCityName && (
        <p className="text-xs text-gray-text">
          {t("legacyCityHint", { city: legacyCityName })}
        </p>
      )}
    </div>
  );
}
