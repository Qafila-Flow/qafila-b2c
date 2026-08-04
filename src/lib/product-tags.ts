import type { ProductTag } from "@/lib/api/products";

export interface TagBadge {
  /** Public path to the badge artwork (self-contained pill, rounded corners baked in). */
  src: string;
  /** Intrinsic pixel size of the artwork — used for next/image ratio + sizing. */
  width: number;
  height: number;
  /** i18n key under `productTag.<key>` — used for alt text / tooltips. */
  key: "limitedEditions" | "luxuries" | "saudiMade";
}

/**
 * Every product tag renders as a ready-made badge image. The artwork is
 * normalized to one shared 940×240 canvas with identical internal padding, so
 * all three badges render at exactly the same size. It already carries its own
 * background and rounded corners — never wrap it in a pill, border or extra
 * background, only size it (fixed height, auto width) and space it.
 */
export const TAG_BADGES: Record<ProductTag, TagBadge> = {
  LIMITED_EDITIONS: {
    src: "/images/tags/limited-editions.png",
    width: 940,
    height: 240,
    key: "limitedEditions",
  },
  LUXURIES: {
    src: "/images/tags/luxuries.png",
    width: 940,
    height: 240,
    key: "luxuries",
  },
  SAUDI_MADE: {
    src: "/images/tags/saudi-made.png",
    width: 940,
    height: 240,
    key: "saudiMade",
  },
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
