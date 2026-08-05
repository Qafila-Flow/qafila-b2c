import type { StaticImageData } from "next/image";
import type { ProductTag } from "@/lib/api/products";
import limitedEditionsEn from "../../public/images/tags/limited-editions.png";
import limitedEditionsAr from "../../public/images/tags/limited-editions-ar.png";
import luxuriesEn from "../../public/images/tags/luxuries.png";
import luxuriesAr from "../../public/images/tags/luxuries-ar.png";
import saudiMadeEn from "../../public/images/tags/saudi-made.png";
import saudiMadeAr from "../../public/images/tags/saudi-made-ar.png";

export interface TagBadgeAsset {
  /** Badge artwork per locale — the Arabic cut is a separate drawing, not a
   * mirrored copy, so both are shipped. Statically imported so each URL
   * carries a content hash and re-exported artwork is never served from a
   * stale cache. */
  src: { en: StaticImageData; ar: StaticImageData };
  /** i18n key under `productTag.<key>` — used for alt text / tooltips. */
  key: "limitedEditions" | "luxuries" | "saudiMade";
}

/**
 * Every product tag renders as a ready-made badge image. The artwork is a
 * self-contained pill: background, rounded corners and internal padding are
 * baked in, and every badge is drawn to the same height, so it only ever needs
 * a height in CSS — never a pill, border or background of its own.
 */
export const TAG_BADGES: Record<ProductTag, TagBadgeAsset> = {
  LIMITED_EDITIONS: {
    src: { en: limitedEditionsEn, ar: limitedEditionsAr },
    key: "limitedEditions",
  },
  LUXURIES: { src: { en: luxuriesEn, ar: luxuriesAr }, key: "luxuries" },
  SAUDI_MADE: { src: { en: saudiMadeEn, ar: saudiMadeAr }, key: "saudiMade" },
};

/** Badge artwork for a tag in the active locale. */
export function tagBadgeSrc(tag: ProductTag, locale: string): StaticImageData {
  return TAG_BADGES[tag].src[locale === "ar" ? "ar" : "en"];
}

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
