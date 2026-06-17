"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition, useCallback } from "react";

const FILTER_KEYS = [
  "brandId",
  "colorId",
  "sizeId",
  "materialId",
  "patternId",
  "categoryId",
  "minPrice",
  "maxPrice",
  "onSale",
  "sortBy",
  "sortOrder",
  "page",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const getParam = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams],
  );

  const getParamIds = useCallback(
    (key: string): string[] => {
      const value = searchParams.get(key);
      return value ? value.split(",").filter(Boolean) : [];
    },
    [searchParams],
  );

  const buildParams = useCallback(
    (updates: Partial<Record<FilterKey, string | null>>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      return params;
    },
    [searchParams],
  );

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [pathname, router],
  );

  const updateFilter = useCallback(
    (key: FilterKey, value: string | null) => {
      const params = buildParams({ [key]: value });
      // Reset page when changing non-page filters
      if (key !== "page") {
        params.delete("page");
      }
      navigate(params);
    },
    [buildParams, navigate],
  );

  const toggleFilterId = useCallback(
    (key: FilterKey, id: string) => {
      const current = getParamIds(key);
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      const params = buildParams({
        [key]: next.length > 0 ? next.join(",") : null,
      });
      params.delete("page");
      navigate(params);
    },
    [getParamIds, buildParams, navigate],
  );

  const clearAllFilters = useCallback(() => {
    // Preserve the search query (if any) when clearing filters — only the
    // filter facets should be reset, not the term the user searched for.
    const q = searchParams.get("q");
    const url = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname;
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const hasActiveFilters = FILTER_KEYS.some(
    (key) => key !== "page" && key !== "sortBy" && key !== "sortOrder" && searchParams.has(key),
  );

  return {
    searchParams,
    getParam,
    getParamIds,
    updateFilter,
    toggleFilterId,
    clearAllFilters,
    hasActiveFilters,
    isPending,
  };
}
