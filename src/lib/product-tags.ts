import type { StaticImageData } from "next/image";
import type { ProductTag } from "@/lib/api/products";
import limitedEditionsBadge from "../../public/images/tags/limited-editions.png";
import luxuriesBadge from "../../public/images/tags/luxuries.png";
import saudiMadeBadge from "../../public/images/tags/saudi-made.png";

export interface TagBadgeAsset {
  /** Badge artwork — a self-contained pill, rounded corners baked in.
   * Statically imported so the URL carries a content hash: re-exported
   * artwork can never be shadowed by a cached copy of the old file. */
  src: StaticImageData;
  /** i18n key under `productTag.<key>` — used for alt text / tooltips. */
  key: "limitedEditions" | "luxuries" | "saudiMade";
}

/**
 * Every product tag renders as a ready-made badge image. The artwork is
 * normalized to one shared 940×240 canvas with identical internal padding, so
 * all three badges render at exactly the same size. It already carries its own
 * background and rounded corners — never wrap it in a pill, border or extra
 * background, only size it and space it.
 */
export const TAG_BADGES: Record<ProductTag, TagBadgeAsset> = {
  LIMITED_EDITIONS: { src: limitedEditionsBadge, key: "limitedEditions" },
  LUXURIES: { src: luxuriesBadge, key: "luxuries" },
  SAUDI_MADE: { src: saudiMadeBadge, key: "saudiMade" },
};

/** Display priority — highest first. Drives the order badges are listed in. */
export const TAG_PRIORITY: ProductTag[] = [
  "SAUDI_MADE",
  "LIMITED_EDITIONS",
  "LUXURIES",
];

/** Marketing tags, highest priority first. SAUDI_MADE is excluded: it is a
 * provenance seal, so compact layouts give it its own corner instead of
 * queueing it with these. */
export const MARKETING_TAGS: ProductTag[] = ["LIMITED_EDITIONS", "LUXURIES"];

/** Tags in display order, filtered to the ones a product actually has. */
export function orderedTags(tags: ProductTag[] = []): ProductTag[] {
  return TAG_PRIORITY.filter((tg) => tags.includes(tg));
}
