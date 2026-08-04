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
import { TAG_BADGES, orderedTags } from "@/lib/product-tags";
import TagBadge from "@/components/shared/TagBadge";

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
  // Tag badges are self-contained artwork, so they all live in one top-left
  // column — sale badge first, then the tags in priority order. Stacking them
  // keeps every badge fully readable on narrow cards and away from the
  // wishlist button in the opposite corner.
  const cardTags = orderedTags(product.tags);

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
        {/* Top-left stack: sale badge, then the tag badges. Uses physical
            `left` (not logical `start`) so it stays on the left in RTL too,
            and inset padding so nothing sits flush against the card edge. */}
        {(product.badge || cardTags.length > 0) && (
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
            {product.badge && (
              <span className="rounded bg-discount px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {product.badge}
              </span>
            )}
            {cardTags.map((tg) => {
              const badge = TAG_BADGES[tg];
              return (
                <TagBadge
                  key={tg}
                  src={badge.src}
                  width={badge.width}
                  height={badge.height}
                  label={tt(badge.key)}
                  className="h-7 drop-shadow-md"
                />
              );
            })}
          </div>
        )}

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
