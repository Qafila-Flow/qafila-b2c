"use client";

import { useTranslations } from "next-intl";
import { Heart, Star, TrendingUp, Crown, Gem, Award } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { getMediaUrl } from "@/lib/utils";
import { useState } from "react";
import type { ProductTag } from "@/lib/api/products";

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

const TAG_STYLES: Record<
  ProductTag,
  {
    icon: typeof Crown;
    /** Solid gradient pill — readable on any photo background */
    pill: string;
    /** i18n key under `productTag.<key>` */
    key: "limitedEditions" | "luxuries" | "originals";
  }
> = {
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
  const tags = product.tags ?? [];
  // Priority: Limited > Luxuries > Originals — the highest-priority tag claims
  // the prominent top-start slot (when no sale badge is competing for it).
  // Any remaining tags render as a uniform pill row along the bottom edge,
  // which keeps contrast consistent across photo backgrounds.
  const tagPriority: ProductTag[] = [
    "LIMITED_EDITIONS",
    "LUXURIES",
    "ORIGINALS",
  ];
  const primaryTag =
    tagPriority.find((tg) => tags.includes(tg)) ?? null;
  const showPrimaryPill = primaryTag !== null && !product.badge;
  const orderedTags = tagPriority.filter((tg) => tags.includes(tg));
  const bottomTags = showPrimaryPill
    ? orderedTags.filter((tg) => tg !== primaryTag)
    : orderedTags;

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
        {/* Top-start: sale badge takes priority, otherwise the highest-priority tag */}
        {product.badge ? (
          <span className="absolute start-2.5 top-2.5 z-10 rounded bg-discount px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {product.badge}
          </span>
        ) : showPrimaryPill && primaryTag ? (
          (() => {
            const style = TAG_STYLES[primaryTag];
            const Icon = style.icon;
            return (
              <span
                className={`absolute start-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.pill}`}
              >
                <Icon size={10} strokeWidth={2.5} />
                {tt(style.key)}
              </span>
            );
          })()
        ) : null}

        {/* Top-end: wishlist only — kept clean and isolated */}
        <button
          aria-label="Add to wishlist"
          onClick={handleWishlistClick}
          className="absolute end-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white dark:bg-dark/80 dark:ring-white/10 dark:hover:bg-dark"
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

        {/* Bottom-start: remaining tag pills sit on a soft gradient scrim
            so they read clearly regardless of the underlying photo */}
        {bottomTags.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end gap-1.5 bg-gradient-to-t from-black/45 via-black/15 to-transparent px-2.5 pb-2 pt-6">
            {bottomTags.map((tg) => {
              const style = TAG_STYLES[tg];
              const Icon = style.icon;
              return (
                <span
                  key={tg}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.pill}`}
                >
                  <Icon size={9} strokeWidth={2.5} />
                  {tt(style.key)}
                </span>
              );
            })}
          </div>
        )}
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
