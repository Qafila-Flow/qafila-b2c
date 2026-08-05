"use client";

import { useTranslations } from "next-intl";
import type { ProductTag } from "@/lib/api/products";
import { TAG_BADGES, orderedTags } from "@/lib/product-tags";
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
  const ordered = orderedTags(tags);
  if (ordered.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {ordered.map((tg) => {
        const badge = TAG_BADGES[tg];
        return (
          <TagBadge
            key={tg}
            src={badge.src}
            label={tt(badge.key)}
            className="h-8 w-auto shrink-0 sm:h-9"
          />
        );
      })}
    </div>
  );
}
