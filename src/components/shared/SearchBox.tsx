"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  CornerDownLeft,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import SarIcon from "@/components/shared/SarIcon";
import { getProducts } from "@/lib/api/products";
import type { ApiProduct } from "@/lib/api/products";
import { getMediaUrl } from "@/lib/utils";
import { useTypewriterPlaceholder } from "@/lib/hooks/useTypewriterPlaceholder";

const RECENT_KEY = "qafila_recent_searches";
const MAX_RECENT = 6;
const SUGGEST_LIMIT = 6;
const DEBOUNCE_MS = 250;

interface Suggestion {
  id: string;
  slug: string | null;
  name: string;
  sub: string;
  image: string | null;
  price: number;
  originalPrice: number | null;
}

function mapSuggestion(item: ApiProduct, locale: string): Suggestion {
  const price = Number(item.price);
  const salePrice = item.salePrice != null ? Number(item.salePrice) : null;
  const hasSale = salePrice != null && salePrice < price;
  const name =
    locale === "ar"
      ? item.brand?.nameAr || item.brand?.name || item.titleAr || item.title
      : item.brand?.name || item.title;
  const sub = locale === "ar" ? item.titleAr || item.title : item.title;
  return {
    id: item.id,
    slug: item.slug,
    name,
    sub,
    image: item.images?.[0]?.url ?? null,
    price: hasSale ? salePrice! : price,
    originalPrice: hasSale ? price : null,
  };
}

/** Bold the part of `text` that matches `query`, case-insensitively. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-dark dark:text-white">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}

interface SearchBoxProps {
  /** "overlay" floats the panel below the input (header); "inline" pushes it into flow (drawer). */
  layout?: "overlay" | "inline";
  /** Called right before navigating away — used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBox({
  layout = "overlay",
  onNavigate,
  className = "",
  autoFocus = false,
}: SearchBoxProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqToken = useRef(0);
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [shortcut, setShortcut] = useState<string | null>(null);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  // Typewriter placeholder (only while idle and empty).
  const placeholders = useMemo<string[]>(() => {
    const raw = t.raw("placeholders");
    return Array.isArray(raw) && raw.length > 0
      ? (raw as string[])
      : [t("placeholder")];
  }, [t]);
  const typed = useTypewriterPlaceholder(placeholders, {
    enabled: !focused && query.length === 0,
  });

  // Popular terms derived from the placeholder list, e.g. Search for "Watches" -> Watches.
  const popular = useMemo(() => {
    const terms = placeholders
      .map((p) => {
        const m = p.match(/["“”«](.+?)["“”»]/);
        return (m ? m[1] : p).trim();
      })
      .filter(Boolean);
    return Array.from(new Set(terms)).slice(0, 6);
  }, [placeholders]);

  // ---- Recent searches (localStorage) ----
  const loadRecent = useCallback(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRecent(parsed.filter((x) => typeof x === "string"));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const saveRecent = useCallback((term: string) => {
    const value = term.trim();
    if (!value) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / privacy mode */
      }
      return next;
    });
  }, []);

  const removeRecent = useCallback((term: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== term);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // ---- Debounced live suggestions ----
  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setLoading(false);
      return;
    }
    const token = ++reqToken.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await getProducts({ search: trimmed, limit: SUGGEST_LIMIT });
        if (token !== reqToken.current) return; // a newer request superseded this one
        setResults(res.data.map((item) => mapSuggestion(item, locale)));
      } catch {
        if (token === reqToken.current) setResults([]);
      } finally {
        if (token === reqToken.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [trimmed, hasQuery, locale]);

  // Reset highlight whenever the option set changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, open]);

  // ---- Close on outside click ----
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ---- Cmd/Ctrl+K to focus (overlay/header only) ----
  useEffect(() => {
    if (layout !== "overlay") return;
    const isMac = /mac|iphone|ipad|ipod/i.test(
      navigator.platform || navigator.userAgent,
    );
    setShortcut(isMac ? "⌘K" : "Ctrl K");
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [layout]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // ---- Flat list of navigable options (for keyboard handling) ----
  type NavItem =
    | { type: "search-all"; term: string }
    | { type: "product"; product: Suggestion }
    | { type: "term"; term: string };

  const navItems = useMemo<NavItem[]>(() => {
    if (hasQuery) {
      return [
        { type: "search-all", term: trimmed },
        ...results.map((product) => ({ type: "product" as const, product })),
      ];
    }
    return [
      ...recent.map((term) => ({ type: "term" as const, term })),
      ...popular.map((term) => ({ type: "term" as const, term })),
    ];
  }, [hasQuery, trimmed, results, recent, popular]);

  const goToSearch = useCallback(
    (term: string) => {
      const value = term.trim();
      if (!value) return;
      saveRecent(value);
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
      onNavigate?.();
      router.push(`/search?q=${encodeURIComponent(value)}`);
    },
    [router, saveRecent, onNavigate],
  );

  const goToProduct = useCallback(
    (slug: string | null) => {
      if (!slug) return;
      saveRecent(trimmed);
      setOpen(false);
      inputRef.current?.blur();
      onNavigate?.();
      router.push(`/products/${slug}`);
    },
    [router, saveRecent, trimmed, onNavigate],
  );

  const activate = useCallback(
    (item: NavItem) => {
      if (item.type === "product") goToProduct(item.product.slug);
      else goToSearch(item.term);
    },
    [goToProduct, goToSearch],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (navItems.length === 0) return;
      setActiveIndex((i) => (i + 1) % navItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (navItems.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? navItems.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && navItems[activeIndex]) {
        activate(navItems[activeIndex]);
      } else if (hasQuery) {
        goToSearch(trimmed);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const showPanel = open;
  const optionId = (i: number) => `${listboxId}-opt-${i}`;
  const activeDescendant =
    activeIndex >= 0 ? optionId(activeIndex) : undefined;

  // ---- Panel content ----
  const panel = (
    <div
      id={listboxId}
      role="listbox"
      aria-label={t("ariaLabel")}
      className={`overflow-hidden bg-white dark:bg-dark ${
        layout === "overlay"
          ? "absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-gray-border shadow-xl dark:border-gray-700 dark:shadow-black/40"
          : "mt-2 rounded-xl border border-gray-border dark:border-gray-700"
      }`}
    >
      <div className="max-h-[70vh] overflow-y-auto overscroll-contain py-1.5">
        {hasQuery ? (
          <>
            {/* Search-all action — always the first navigable option */}
            <button
              type="button"
              id={optionId(0)}
              role="option"
              aria-selected={activeIndex === 0}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => goToSearch(trimmed)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm ${
                activeIndex === 0
                  ? "bg-gray-light dark:bg-gray-800"
                  : "hover:bg-gray-light dark:hover:bg-gray-800"
              }`}
            >
              <Search size={16} className="shrink-0 text-gray-text" />
              <span className="flex-1 truncate text-dark dark:text-gray-100">
                {t("searchFor")}{" "}
                <span className="font-semibold">&ldquo;{trimmed}&rdquo;</span>
              </span>
              <CornerDownLeft size={14} className="shrink-0 text-gray-300 dark:text-gray-600" />
            </button>

            {/* Live product results */}
            {loading && results.length === 0 ? (
              <div className="px-4 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-md bg-gray-light dark:bg-gray-700" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-light dark:bg-gray-700" />
                      <div className="h-2.5 w-3/4 animate-pulse rounded bg-gray-light dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-text">
                  {t("products")}
                </p>
                {results.map((p, i) => {
                  const index = i + 1; // offset by the search-all option
                  return (
                    <button
                      type="button"
                      key={p.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goToProduct(p.slug)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-start ${
                        activeIndex === index
                          ? "bg-gray-light dark:bg-gray-800"
                          : "hover:bg-gray-light dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                        {p.image ? (
                          <Image
                            src={getMediaUrl(p.image) || p.image}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-gray-300">
                            <Search size={14} />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold uppercase tracking-wide text-dark dark:text-gray-100">
                          <Highlight text={p.name} query={trimmed} />
                        </span>
                        <span className="block truncate text-[11px] text-gray-text">
                          <Highlight text={p.sub} query={trimmed} />
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-dark dark:text-gray-100" dir="ltr">
                        <SarIcon /> {p.price.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}`}
                  onClick={() => {
                    saveRecent(trimmed);
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 border-t border-gray-border px-4 py-2.5 text-xs font-semibold text-primary hover:bg-gray-light dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {t("viewAll", { query: trimmed })}
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </Link>
              </>
            ) : (
              !loading && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-dark dark:text-gray-100">
                    {t("noResults", { query: trimmed })}
                  </p>
                  <p className="mt-1 text-xs text-gray-text">{t("noResultsHint")}</p>
                </div>
              )
            )}
          </>
        ) : (
          <>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="pb-1">
                <div className="flex items-center justify-between px-4 pb-1 pt-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-text">
                    {t("recent")}
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[11px] font-medium text-gray-text hover:text-dark dark:hover:text-gray-100"
                  >
                    {t("clearRecent")}
                  </button>
                </div>
                {recent.map((term, i) => (
                  <div
                    key={term}
                    id={optionId(i)}
                    role="option"
                    aria-selected={activeIndex === i}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`group flex items-center gap-3 px-4 py-2 text-sm ${
                      activeIndex === i
                        ? "bg-gray-light dark:bg-gray-800"
                        : "hover:bg-gray-light dark:hover:bg-gray-800"
                    }`}
                  >
                    <Clock size={15} className="shrink-0 text-gray-text" />
                    <button
                      type="button"
                      onClick={() => goToSearch(term)}
                      className="flex-1 truncate text-start text-dark dark:text-gray-200"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      aria-label={t("clear")}
                      onClick={() => removeRecent(term)}
                      className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-dark group-hover:opacity-100 dark:hover:text-gray-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Popular searches */}
            {popular.length > 0 && (
              <div className="px-4 py-2">
                <p className="flex items-center gap-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-text">
                  <TrendingUp size={13} />
                  {t("popular")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {popular.map((term, j) => {
                    const idx = recent.length + j;
                    return (
                      <button
                        type="button"
                        key={term}
                        id={optionId(idx)}
                        role="option"
                        aria-selected={activeIndex === idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => goToSearch(term)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          activeIndex === idx
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-border text-dark hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {term}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-text"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={focused ? t("placeholder") : `${typed}|`}
          aria-label={t("ariaLabel")}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          className={`w-full rounded-full border border-gray-border bg-gray-light py-2.5 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-dark dark:text-gray-100 dark:placeholder:text-gray-400 ps-10 ${
            query ? "pe-10" : shortcut ? "pe-16" : "pe-4"
          }`}
        />

        {/* Clear button */}
        {query ? (
          <button
            type="button"
            aria-label={t("clear")}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
              setOpen(true);
            }}
            className="absolute end-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-gray-text hover:bg-gray-200 hover:text-dark dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
          </button>
        ) : (
          shortcut && (
            <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 select-none rounded border border-gray-border px-1.5 py-0.5 text-[10px] font-medium text-gray-text dark:border-gray-700 md:block">
              {shortcut}
            </kbd>
          )
        )}
      </div>

      {showPanel && panel}
    </div>
  );
}
