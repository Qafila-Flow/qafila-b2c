import { Crown, Gem, Award } from "lucide-react";
import type { ProductTag } from "@/lib/api/products";

export interface ProductTagStyle {
  icon: typeof Crown;
  /** Solid gradient pill — readable on any photo background */
  pill: string;
  /** i18n key under `productTag.<key>` */
  key: "limitedEditions" | "luxuries" | "originals";
}

export const TAG_STYLES: Record<ProductTag, ProductTagStyle> = {
  LIMITED_EDITIONS: {
    icon: Crown,
    pill: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-900/30 ring-1 ring-white/20",
    key: "limitedEditions",
  },
  LUXURIES: {
    icon: Gem,
    pill: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-900/30 ring-1 ring-white/20",
    key: "luxuries",
  },
  ORIGINALS: {
    icon: Award,
    pill: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-white/20",
    key: "originals",
  },
};

/** Display priority — highest first. The top-priority tag claims the
 * prominent slot in compact layouts (e.g. the product card overlay). */
export const TAG_PRIORITY: ProductTag[] = [
  "LIMITED_EDITIONS",
  "LUXURIES",
  "ORIGINALS",
];
