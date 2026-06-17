"use client";

import { useTranslations } from "next-intl";
import type { ProductTag } from "@/lib/api/products";
import { TAG_STYLES, TAG_PRIORITY, SAUDI_MADE_SEAL } from "@/lib/product-tags";

/**
 * Renders a product's tags as a row of gradient pills, with the "Saudi Made"
 * seal shown as an image badge ahead of them.
 * Returns nothing when the product has no tags.
 */
export default function ProductTags({
  tags,
  className = "",
}: {
  tags: ProductTag[];
  className?: string;
}) {
  const tt = useTranslations("productTag");
  const ordered = TAG_PRIORITY.filter((tg) => tags.includes(tg));
  const hasSaudiMade = tags.includes("SAUDI_MADE");
  if (ordered.length === 0 && !hasSaudiMade) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {hasSaudiMade && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SAUDI_MADE_SEAL}
          alt={tt("saudiMade")}
          width={52}
          height={35}
          className="h-7 w-auto drop-shadow-sm"
        />
      )}
      {ordered.map((tg) => {
        const style = TAG_STYLES[tg];
        const Icon = style.icon;
        return (
          <span
            key={tg}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.pill}`}
          >
            <Icon size={12} strokeWidth={2.5} />
            {tt(style.key)}
          </span>
        );
      })}
    </div>
  );
}
