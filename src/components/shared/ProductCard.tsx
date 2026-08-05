"use client";

import { useTranslations } from "next-intl";
import { Heart, Star, TrendingUp } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { getMediaUrl } from "@/lib/utils";
import { useState } from "react";
import type { ProductTag } from "@/lib/api/products";
import { TAG_BADGES, MARKETING_TAGS } from "@/lib/product-tags";
import TagBadge from "@/components/shared/TagBadge";

/** Every corner slot is the same fraction of the card, and every badge fills
 * its slot — so all badges render at an identical size and the two bottom
 * ones can never meet, whatever the card width. */
const BADGE_SLOT = "w-[38%]";
const CARD_BADGE = "h-auto w-full drop-shadow-md";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  rating: number;
  reviews: number;
  trending: boolean;
  badge: string | null;
  image?: string | null;
  slug?: string | null;
  tags?: ProductTag[];
}

export default function ProductCard({
  product,
  variant = "carousel",
  onRequireLogin,
}: {
  product: Product;
  variant?: "carousel" | "grid";
  onRequireLogin?: () => void;
}) {
  const t = useTranslations("product");
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [toggling, setToggling] = useState(false);

  const tt = useTranslations("productTag");
  const wishlisted = isInWishlist(product.id);
  // Badges are spread over three corners instead of stacked in one: the
  // headline marketing tag sits top-start under any sale badge, the Saudi-Made
  // seal owns the bottom-start corner, and a second marketing tag (rare) goes
  // bottom-end. The wishlist button keeps the top-end corner to itself.
  const tags = product.tags ?? [];
  const marketing = MARKETING_TAGS.filter((tg) => tags.includes(tg));
  const topTag = marketing[0] ?? null;
  const bottomEndTag = marketing[1] ?? null;
  const hasSaudiMade = tags.includes("SAUDI_MADE");

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setToggling(false);
    }
  };

  const content = (
    <div
      className={` cursor-pointer rounded-lg bg-white dark:bg-dark border border-gray-200 dark:border-gray-700  h-full ${
        variant === "grid" ? "w-full" : "min-w-57.5 max-w-62.5 shrink-0"
      }`}
    >
      {/* Image */}
      <div className="relative mb-2.5 min-h-80 overflow-hidden rounded-t-lg bg-gray-100 dark:bg-dark">
        {/* Corner overlays. They share this one full-size layer so every slot
            sizes off the same box, and use physical `left`/`right` (not
            logical `start`/`end`) so they hold their place in RTL. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Top-left: sale badge, then the headline marketing tag. */}
          {(product.badge || topTag) && (
            <div
              className={`absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5 ${BADGE_SLOT}`}
            >
              {product.badge && (
                <span className="rounded bg-discount px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {product.badge}
                </span>
              )}
              {topTag && (
                <TagBadge
                  src={TAG_BADGES[topTag].src}
                  width={TAG_BADGES[topTag].width}
                  height={TAG_BADGES[topTag].height}
                  label={tt(TAG_BADGES[topTag].key)}
                  className={CARD_BADGE}
                />
              )}
            </div>
          )}

          {/* Bottom-left: the Saudi-Made provenance seal. */}
          {hasSaudiMade && (
            <div className={`absolute bottom-2.5 left-2.5 ${BADGE_SLOT}`}>
              <TagBadge
                src={TAG_BADGES.SAUDI_MADE.src}
                width={TAG_BADGES.SAUDI_MADE.width}
                height={TAG_BADGES.SAUDI_MADE.height}
                label={tt(TAG_BADGES.SAUDI_MADE.key)}
                className={CARD_BADGE}
              />
            </div>
          )}

          {/* Bottom-right: overflow marketing tag, kept opposite the seal. */}
          {bottomEndTag && (
            <div className={`absolute bottom-2.5 right-2.5 ${BADGE_SLOT}`}>
              <TagBadge
                src={TAG_BADGES[bottomEndTag].src}
                width={TAG_BADGES[bottomEndTag].width}
                height={TAG_BADGES[bottomEndTag].height}
                label={tt(TAG_BADGES[bottomEndTag].key)}
                className={CARD_BADGE}
              />
            </div>
          )}
        </div>

        {/* Top-right: wishlist only — kept clean and isolated. Uses physical
            `right` (not logical `end`) so it stays on the right in RTL too. */}
        <button
          aria-label="Add to wishlist"
          onClick={handleWishlistClick}
          className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white dark:bg-dark/80 dark:ring-white/10 dark:hover:bg-dark"
        >
          <Heart
            size={15}
            className={`transition-colors ${
              wishlisted
                ? "fill-discount text-discount"
                : "text-gray-500 hover:text-discount dark:text-gray-300"
            }`}
          />
        </button>

        {product.image ? (
          <Image
            src={getMediaUrl(product.image) || product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes={
              variant === "grid"
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                : "210px"
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
            Product Image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 p-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-dark dark:text-gray-100">
          {product.name}
        </h3>
        <p className="truncate text-[11px] text-gray-text">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold">{product.rating}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={
                  i < Math.floor(product.rating)
                    ? "fill-star text-star"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-text">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold text-dark dark:text-gray-100"
            dir="ltr"
          >
            <SarIcon /> {Number(product.price).toFixed(1)}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] text-gray-text line-through">
              {Number(product.originalPrice).toFixed(1)}
            </span>
          )}
          {product.discount && (
            <span className="text-[11px] font-semibold text-discount">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Trending */}
        {product.trending && (
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-green" />
            <span className="text-[11px] font-medium text-green">
              {t("trendingNow")}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (product.slug) {
    return (
      <Link href={`/products/${product.slug}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
