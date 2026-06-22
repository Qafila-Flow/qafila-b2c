"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Heart, ShoppingCart, Star } from "lucide-react";
import SarIcon from "@/components/shared/SarIcon";
import Image from "next/image";
import ImageGallery from "./ImageGallery";
import ColorSelector from "./ColorSelector";
import type { ColorVariant } from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import type { SizeOption } from "./SizeSelector";
import QuantityPicker from "./QuantityPicker";
import ProductInfoTabs from "./ProductInfoTabs";
import ProductTags from "./ProductTags";
import ReviewsSection from "./ReviewsSection";
import type { ReviewData } from "./ReviewCard";
import type { Product } from "@/components/shared/ProductCard";
import type { ProductTag } from "@/lib/api/products";
import ProductCard from "@/components/shared/ProductCard";
import VendorBanner from "./VendorBanner";
import type { VendorData } from "./VendorBanner";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import {
  getProductReviews,
  getReviewStats,
  type GetReviewsParams,
} from "@/lib/api/reviews";
import { getProductById } from "@/lib/api/products";
interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

export interface ProductVariantInfo {
  id: string;
  productColorId: string;
  productSizeId: string;
}

interface ProductData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  sku: string | null;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  brand: string | null;
  material: string | null;
  pattern: string | null;
  tags: ProductTag[];
}

interface Props {
  product: ProductData;
  colors: ColorVariant[];
  sizes: SizeOption[];
  variants: ProductVariantInfo[];
  /** Maps color.id (used in UI) → productColor.id (used in variants) */
  colorIdToProductColorId: Record<string, string>;
  /** Maps size.id (used in UI) → productSize.id (used in variants) */
  sizeIdToProductSizeId: Record<string, string>;
  initialSelectedColorId: string | null;
  reviewStats: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
  initialReviews: ReviewData[];
  hasMoreReviews: boolean;
  recommended: Product[];
  vendor: VendorData | null;
}

// Map sort UI keys to API params
const SORT_MAP: Record<string, GetReviewsParams> = {
  mostRelevant: { sortBy: "helpfulCount", sortOrder: "desc" },
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  highest: { sortBy: "rating", sortOrder: "desc" },
  lowest: { sortBy: "rating", sortOrder: "asc" },
};

export default function ProductDetailClient({
  product,
  colors,
  sizes,
  variants,
  colorIdToProductColorId,
  sizeIdToProductSizeId,
  initialSelectedColorId,
  reviewStats: initialReviewStats,
  initialReviews,
  hasMoreReviews,
  recommended,
  vendor,
}: Props) {
  const t = useTranslations("productDetail");
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    initialSelectedColorId,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMore, setHasMore] = useState(hasMoreReviews);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentSort, setCurrentSort] = useState<string>("mostRelevant");
  const [reviewStats, setReviewStats] = useState(initialReviewStats);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  // The product page is server-rendered without the user's token, so the
  // server can't tell us whether this user follows the vendor. Re-fetch the
  // product on the client (the API client attaches the token) to hydrate the
  // real follow state for the banner.
  const [vendorFollow, setVendorFollow] = useState<{
    isFollowing: boolean;
    followersCount?: number;
  } | null>(null);

  const vendorId = vendor?.id;
  useEffect(() => {
    if (!isLoggedIn || !vendorId) return;
    let active = true;
    getProductById(product.id)
      .then((res) => {
        if (!active || !res.vendor) return;
        setVendorFollow({
          isFollowing: res.vendor.isFollowing ?? false,
          followersCount: res.vendor.followerCount,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isLoggedIn, vendorId, product.id]);

  const bannerVendor: VendorData | null = vendor
    ? {
        ...vendor,
        isFollowing: vendorFollow?.isFollowing ?? vendor.isFollowing,
        followersCount: vendorFollow?.followersCount ?? vendor.followersCount,
      }
    : null;

  const wishlisted = isInWishlist(product.id);

  const handleWishlistToggle = useCallback(async () => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    if (togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setTogglingWishlist(false);
    }
  }, [isLoggedIn, togglingWishlist, toggleWishlist, product.id]);

  const handleAddToCart = useCallback(async () => {
    if (addingToCart) return;
    setAddingToCart(true);
    setAddedToCart(false);
    try {
      // Resolve the actual variant ID from the selected color + size
      let variantId: string | undefined;
      if (variants.length > 0) {
        const pcId = selectedColorId
          ? colorIdToProductColorId[selectedColorId]
          : undefined;
        const psId = selectedSizeId
          ? sizeIdToProductSizeId[selectedSizeId]
          : undefined;

        const match = variants.find((v) => {
          const colorMatch = pcId ? v.productColorId === pcId : true;
          const sizeMatch = psId ? v.productSizeId === psId : true;
          return colorMatch && sizeMatch;
        });
        variantId = match?.id;
      }

      await addItem({
        productId: product.id,
        variantId,
        quantity,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      // error handled by cart context
    } finally {
      setAddingToCart(false);
    }
  }, [
    addItem,
    product.id,
    selectedColorId,
    selectedSizeId,
    quantity,
    addingToCart,
    variants,
    colorIdToProductColorId,
    sizeIdToProductSizeId,
  ]);

  const handleColorSelect = useCallback((color: ColorVariant) => {
    setSelectedColorId(color.id);
  }, []);

  const handleSizeSelect = useCallback((size: SizeOption) => {
    setSelectedSizeId(size.id);
  }, []);

  // Fetch reviews with given sort/page
  const fetchReviews = useCallback(
    async (sortKey: string, page: number, append: boolean) => {
      const sortParams = SORT_MAP[sortKey] || SORT_MAP.mostRelevant;
      try {
        const res = await getProductReviews(product.id, {
          ...sortParams,
          page,
          limit: 5,
        });
        const mapped = res.data.map(mapApiReview);
        if (append) {
          setReviews((prev) => [...prev, ...mapped]);
        } else {
          setReviews(mapped);
        }
        setHasMore(page < res.meta.totalPages);
        setReviewPage(page);
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
      }
    },
    [product.id],
  );

  const handleLoadMoreReviews = useCallback(async () => {
    setLoadingMore(true);
    await fetchReviews(currentSort, reviewPage + 1, true);
    setLoadingMore(false);
  }, [fetchReviews, currentSort, reviewPage]);

  const handleSortChange = useCallback(
    async (sortKey: string) => {
      setCurrentSort(sortKey);
      setLoadingMore(true);
      await fetchReviews(sortKey, 1, false);
      setLoadingMore(false);
    },
    [fetchReviews],
  );

  const handleReviewSubmitted = useCallback(async () => {
    // Refresh both reviews and stats
    await fetchReviews(currentSort, 1, false);
    try {
      const stats = await getReviewStats(product.id);
      setReviewStats({
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        distribution: stats.ratingDistribution,
      });
    } catch {
      // silently fail
    }
  }, [fetchReviews, currentSort, product.id]);

  const handleRequireLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const maxQty = Math.min(product.stock, 10);
  const inStock = product.stock > 0;
  const hasSale = product.originalPrice != null && product.discount != null;

  // Installment calculation (4 payments)
  const installment = (product.price / 4).toFixed(2);

  // Build design details list
  const selectedColor = colors.find((c) => c.id === selectedColorId);
  const designDetails: { label: string; value: string }[] = [];
  if (selectedColor)
    designDetails.push({ label: t("color"), value: selectedColor.name });
  if (product.material)
    designDetails.push({ label: t("material"), value: product.material });
  if (product.pattern)
    designDetails.push({ label: t("pattern"), value: product.pattern });
  if (product.brand)
    designDetails.push({ label: t("brand"), value: product.brand });
  if (product.sku) designDetails.push({ label: t("sku"), value: product.sku });

  const sarTag = () => <SarIcon key="sar" />;
  const deliveryLines = [
    t.rich("freeDelivery", { sar: sarTag }),
    t("fastReturns"),
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left — Image Gallery */}
        <ImageGallery images={product.images} productName={product.title} />

        {/* Right — Product Info */}
        <div className="space-y-5">
          {/* Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-dark dark:text-gray-100">{product.title}</h1>
            {product.description && (
              <p className="mt-1 text-xs leading-relaxed text-gray-text line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Tags */}
          <ProductTags tags={product.tags} />

          {/* Rating summary */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={
                    i < Math.round(Number(product.averageRating))
                      ? "fill-star text-star"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <span className="text-xs font-medium text-dark dark:text-gray-200">
              {Number(product.averageRating).toFixed(1)}
            </span>
            <span className="text-xs text-gray-text">
              ({product.reviewCount} {t("reviews")})
            </span>
          </div>

          {/* Color selector */}
          <ColorSelector
            colors={colors}
            selectedId={selectedColorId}
            onSelect={handleColorSelect}
          />

          {/* Price block */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-dark dark:text-gray-100" dir="ltr">
                <SarIcon /> {Number(product.price).toFixed(2)}
              </span>
              {hasSale && (
                <>
                  <span
                    className="text-sm text-gray-text line-through"
                    dir="ltr"
                  >
                    <SarIcon /> {Number(product.originalPrice!).toFixed(2)}
                  </span>
                  <span className="rounded bg-discount/10 px-1.5 py-0.5 text-xs font-bold text-discount">
                    -{product.discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tabby & Tamara installments */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tabby */}
            <div className="rounded-lg border border-[#5AFEAE] dark:border-[#5AFEAE]/50 p-3 relative dark:bg-[#5AFEAE]/5">
              <div className="mb-2 absolute top-0 left-0">
                <Image
                  src="/images/tabby.svg"
                  alt="Tabby"
                  width={60}
                  height={20}
                  className="h-5 w-auto"
                />
              </div>
              <p className="text-sm leading-relaxed text-gray-text mt-4">
                {t.rich("tabbyText", { amount: installment, sar: sarTag })}
              </p>
              <button className="mt-1 text-[11px] font-semibold text-dark dark:text-gray-200 underline">
                {t("learnMore")}
              </button>
            </div>
            {/* Tamara */}
            <div className="rounded-lg border border-[#EDBD96] dark:border-[#EDBD96]/50 p-3 relative dark:bg-[#EDBD96]/5">
              <div className="mb-2 absolute top-0 left-0">
                <Image
                  src="/images/tamara.svg"
                  alt="Tamara"
                  width={72}
                  height={20}
                  className="h-5 w-auto"
                />
              </div>
              <p className="text-sm leading-relaxed text-gray-text mt-4">
                {t.rich("tamaraText", { amount: installment, sar: sarTag })}
              </p>
              <button className="mt-1 text-[11px] font-semibold text-dark dark:text-gray-200 underline">
                {t("learnMore")}
              </button>
            </div>
          </div>

          {/* Size selector */}
          <SizeSelector
            sizes={sizes}
            selectedId={selectedSizeId}
            onSelect={handleSizeSelect}
          />

          {/* Quantity */}
          {inStock && (
            <QuantityPicker
              value={quantity}
              max={maxQty}
              onChange={setQuantity}
            />
          )}

          {/* Stock status */}
          <div className="text-xs font-medium">
            {!inStock ? (
              <span className="text-discount">{t("outOfStock")}</span>
            ) : product.stock <= 5 ? (
              <span className="text-discount">
                {t("onlyLeft", { count: product.stock })}
              </span>
            ) : (
              <span className="text-green">{t("inStock")}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                addedToCart ? "bg-green" : "bg-dark hover:bg-dark/85"
              }`}
            >
              {addingToCart ? "..." : addedToCart ? "✓" : t("addToCart")}
            </button>
            <button
              onClick={handleWishlistToggle}
              disabled={togglingWishlist}
              className={`flex items-center gap-2 rounded-lg border border-gray-border dark:border-gray-700 px-5 py-3.5 text-sm font-medium transition-colors ${
                wishlisted
                  ? "border-discount bg-discount/5 hover:bg-discount/10"
                  : "hover:border-gray-text dark:hover:border-gray-500"
              }`}
            >
              <Heart
                size={18}
                className={
                  wishlisted ? "fill-discount text-discount" : "text-dark dark:text-gray-300"
                }
              />
              <span className="text-dark dark:text-gray-300">{t("moveToWishlist")}</span>
            </button>
          </div>

          {/* Design Details / Delivery tabs */}
          <ProductInfoTabs
            details={designDetails}
            deliveryLines={deliveryLines}
          />
        </div>
      </div>

      {/* Reviews section */}
      <ReviewsSection
        productId={product.id}
        averageRating={reviewStats.averageRating}
        totalReviews={reviewStats.totalReviews}
        distribution={reviewStats.distribution}
        reviews={reviews}
        hasMore={hasMore}
        onLoadMore={handleLoadMoreReviews}
        loadingMore={loadingMore}
        onSortChange={handleSortChange}
        onReviewSubmitted={handleReviewSubmitted}
        onRequireLogin={handleRequireLogin}
      />

      {/* You May Also Like */}
      {recommended.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-dark dark:text-gray-100">
            {t("youMayAlsoLike")}
          </h2>
          <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Vendor banner */}
      {bannerVendor && (
        <VendorBanner
          key={vendorFollow ? "follow-hydrated" : "follow-initial"}
          vendor={bannerVendor}
          onRequireLogin={handleRequireLogin}
        />
      )}

      {/* Login modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}

// Helper to map API review to ReviewData
function mapApiReview(r: {
  id: string;
  productId: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  hasLiked: boolean;
  user: { id: string; firstName: string; lastName: string };
  media?: {
    id: string;
    url: string;
    alt?: string | null;
    sortOrder?: number;
    type?: string;
    duration?: number | null;
    thumbnailUrl?: string | null;
  }[];
  commentCount: number;
  createdAt: string;
}): ReviewData {
  return {
    id: r.id,
    userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
    userAvatar: null,
    userId: r.user.id,
    rating: r.rating,
    title: r.title ?? null,
    comment: r.content || "",
    isVerifiedPurchase: r.isVerifiedPurchase,
    helpfulCount: r.helpfulCount,
    hasLiked: r.hasLiked,
    commentCount: r.commentCount,
    createdAt: r.createdAt,
    media: (r.media || []).map((m) => ({
      id: m.id,
      url: m.url,
      alt: m.alt ?? null,
      type: (m.type || "IMAGE") as "IMAGE" | "VIDEO" | "VOICE_NOTE",
      duration: m.duration,
      thumbnailUrl: m.thumbnailUrl,
    })),
  };
}

export { mapApiReview };
