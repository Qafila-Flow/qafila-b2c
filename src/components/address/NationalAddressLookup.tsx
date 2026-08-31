"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, MapPin, Check } from "lucide-react";
import { searchAddress, type ResolvedAddress } from "@/lib/api/shipping";

interface Props {
  onSelect: (address: ResolvedAddress) => void;
  verified?: boolean;
}

/**
 * Resolve a delivery address from a building number and postal code.
 *
 * Deliberately a button, not a search-as-you-type field. The National Address
 * account allows only a handful of calls per minute across the entire platform,
 * so one customer typing would starve everyone else's checkout.
 *
 * Everything here degrades to nothing: if the lookup is unavailable the note
 * says so and the manual fields below carry on working. An address that never
 * gets verified still ships.
 */
export default function NationalAddressLookup({ onSelect, verified }: Props) {
  const t = useTranslations("addresses");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResolvedAddress[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (query.trim().length < 3) return;

    setLoading(true);
    setNote(null);
    setResults(null);

    try {
      const response = await searchAddress(
        query.trim(),
        locale === "ar" ? "ar" : "en",
      );

      if (!response.available) {
        setNote(t("lookupUnavailable"));
        return;
      }

      setResults(response.results);
      if (response.results.length === 0) setNote(t("noAddressFound"));
    } catch {
      setNote(t("lookupUnavailable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t("findAddress")}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Inside a form: Enter must not submit a half-filled address.
              e.preventDefault();
              void run();
            }
          }}
          placeholder={t("findAddressHint")}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-black focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || query.trim().length < 3}
          className="rounded-lg border border-gray-300 px-4 py-2.5 disabled:opacity-40"
          aria-label={t("findAddress")}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {verified && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <Check className="h-4 w-4" />
          {t("addressVerified")}
        </p>
      )}

      {note && <p className="text-sm text-gray-500">{note}</p>}

      {results && results.length > 0 && (
        <ul className="divide-y rounded-lg border border-gray-200">
          {results.map((a, i) => (
            <li key={`${a.buildingNumber}-${a.postalCode}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(a);
                  setResults(null);
                  setNote(null);
                }}
                className="flex w-full items-start gap-2 p-3 text-start hover:bg-gray-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm">
                  {[a.line1, a.line2].filter(Boolean).join(" - ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
