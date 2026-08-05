"use client";

import { useTranslations, useLocale } from "next-intl";
import type { ProductTag } from "@/lib/api/products";
import { TAG_BADGES, orderedTags, tagBadgeSrc } from "@/lib/product-tags";
import TagBadge from "@/components/shared/TagBadge";

/**
 * Renders a product's tags as a row of badge images.
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
  const locale = useLocale();
  const ordered = orderedTags(tags);
  if (ordered.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {ordered.map((tg) => (
        <TagBadge
          key={tg}
          src={tagBadgeSrc(tg, locale)}
          label={tt(TAG_BADGES[tg].key)}
          className="h-8 w-auto shrink-0 sm:h-9"
        />
      ))}
    </div>
  );
}
