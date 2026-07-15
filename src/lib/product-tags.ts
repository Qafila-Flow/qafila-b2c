import { Crown, Gem } from "lucide-react";
import type { ProductTag } from "@/lib/api/products";

/** Marketing tags that render as a text pill (icon + label). SAUDI_MADE is
 * intentionally excluded — it renders as an image seal (see {@link SAUDI_MADE_SEAL})
 * handled separately so it never collides with these pills. */
export type PillTag = Exclude<ProductTag, "SAUDI_MADE">;

export interface ProductTagStyle {
  icon: typeof Crown;
  /** Solid gradient pill — readable on any photo background */
  pill: string;
  /** i18n key under `productTag.<key>` */
  key: "limitedEditions" | "luxuries";
}

export const TAG_STYLES: Record<PillTag, ProductTagStyle> = {
  // Cohesive warm palette anchored on the brand amber (--color-primary #e8983a):
  // amber hero / black-and-gold luxury / warm stone — one system, three tones.
  LIMITED_EDITIONS: {
    icon: Crown,
    pill: "bg-gradient-to-r from-[#e8983a] to-[#c96a25] text-white shadow-md shadow-amber-900/30 ring-1 ring-white/20",
    key: "limitedEditions",
  },
  LUXURIES: {
    icon: Gem,
    pill: "bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-md shadow-black/30 ring-1 ring-amber-400/30",
    key: "luxuries",
  },
};

/** Display priority — highest first. The top-priority tag claims the
 * prominent slot in compact layouts (e.g. the product card overlay). */
export const TAG_PRIORITY: PillTag[] = ["LIMITED_EDITIONS", "LUXURIES"];

/** Public path to the "Saudi Made" seal asset. Rendered as an image badge
 * (not a text pill) so the made-in seal reads as a distinct mark. */
export const SAUDI_MADE_SEAL = "/images/saudi-made.svg";
