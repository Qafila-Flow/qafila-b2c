"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Heart,
  Send,
  Star,
  BadgeCheck,
  SaudiRiyal,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { getMediaUrl } from "@/lib/utils";
import {
  markStoryViewed,
  toggleStoryLike,
  getStoryComments,
  createStoryComment,
} from "@/lib/api/stories";
import { getProductById, type ApiProduct } from "@/lib/api/products";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import StoryComments from "./StoryComments";
import type { Story, StoryComment } from "@/types/story";

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const IMAGE_DURATION = 8000;

export default function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: StoryViewerProps) {
  const t = useTranslations("stories");
  const tProduct = useTranslations("productDetail");
  const locale = useLocale();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [recentComments, setRecentComments] = useState<StoryComment[]>([]);
  const [linkedProduct, setLinkedProduct] = useState<ApiProduct | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const story = stories[currentIndex];
  if (!story) return null;

  const isVideo = story.mediaType === "VIDEO";
  const vendorName =
    locale === "ar"
      ? story.vendor.storeNameAr || story.vendor.storeName
      : story.vendor.storeName;
  const mediaUrl = getMediaUrl(story.mediaUrl);
  const vendorLogo = getMediaUrl(story.vendor.logo);
  const caption =
    locale === "ar" ? story.captionAr || story.caption : story.caption;

  // Derived product display values
  const productName = linkedProduct
    ? locale === "ar"
      ? linkedProduct.titleAr || linkedProduct.title
      : linkedProduct.title
    : null;
  const productDesc = linkedProduct
    ? locale === "ar"
      ? linkedProduct.descriptionAr || linkedProduct.description
      : linkedProduct.description
    : null;
  const productImage =
    linkedProduct?.images?.find((img) => img.isDefault)?.url ||
    linkedProduct?.images?.[0]?.url ||
    null;
  const productPrice = linkedProduct?.salePrice
    ? Number(linkedProduct.salePrice)
    : linkedProduct
      ? Number(linkedProduct.price)
      : 0;
  const productOriginalPrice = linkedProduct?.salePrice
    ? Number(linkedProduct.price)
    : null;
  const productDiscount =
    productOriginalPrice && productPrice
      ? Math.round(
          ((productOriginalPrice - productPrice) / productOriginalPrice) * 100,
        )
      : null;

  // Sync state from story data when story changes
  useEffect(() => {
    setLiked(story.hasLiked);
    setLikeCount(story.likeCount);
    setCommentCount(story.commentCount);
    setCommentsOpen(false);
    setCommentText("");
    setRecentComments([]);
    setLinkedProduct(null);
  }, [story.id, story.hasLiked, story.likeCount, story.commentCount]);

  // Fetch linked product when story has linkType PRODUCT
  useEffect(() => {
    if (story.linkType === "PRODUCT" && story.linkId) {
      getProductById(story.linkId)
        .then((p) => setLinkedProduct(p))
        .catch(() => {});
    }
  }, [story.id, story.linkType, story.linkId]);

  // Fetch last 2 comments for inline preview
  useEffect(() => {
    getStoryComments(story.id, 1, 2)
      .then((res) => setRecentComments(res.data))
      .catch(() => {});
  }, [story.id]);

  const resetState = () => {
    setProgress(0);
    elapsedRef.current = 0;
  };

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetState();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetState();
    }
  }, [currentIndex]);

  const effectivePaused = paused || commentsOpen;

  // Image auto-progress timer
  useEffect(() => {
    if (isVideo || effectivePaused) return;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const p = Math.min((elapsed / IMAGE_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) goNext();
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [currentIndex, effectivePaused, goNext, isVideo]);

  // Video playback management
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !isVideo) return;
    vid.currentTime = 0;
    vid.muted = muted;
    if (effectivePaused) vid.pause();
    else vid.play().catch(() => {});
  }, [currentIndex, effectivePaused, isVideo, muted]);

  const handleVideoTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || vid.duration === 0) return;
    setProgress((vid.currentTime / vid.duration) * 100);
  };

  const handleVideoEnded = () => goNext();

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      const vid = videoRef.current;
      if (vid && isVideo) {
        if (next) vid.pause();
        else vid.play().catch(() => {});
      }
      return next;
    });
  };

  // Mark as viewed
  useEffect(() => {
    if (story && !story.hasViewed) {
      markStoryViewed(story.id).catch(() => {});
    }
  }, [story]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (commentsOpen) {
        if (e.key === "Escape") setCommentsOpen(false);
        return;
      }
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        togglePause();
      }
      if (e.key === "m" || e.key === "M") setMuted((m) => !m);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev, commentsOpen]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Like toggle
  const handleLike = async () => {
    if (!isLoggedIn) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      const res = await toggleStoryLike(story.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  // Inline comment submit
  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submittingComment || !isLoggedIn) return;
    setSubmittingComment(true);
    try {
      const newComment = await createStoryComment(story.id, trimmed);
      setRecentComments((prev) => [newComment, ...prev].slice(0, 2));
      setCommentCount((c) => c + 1);
      setCommentText("");
    } catch {
      // silently fail
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddToCart = async () => {
    if (!linkedProduct) return;
    try {
      await addItem({ productId: linkedProduct.id, quantity: 1 });
    } catch {
      // silently fail
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute end-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Previous arrow */}
      {currentIndex > 0 && !commentsOpen && (
        <button
          onClick={goPrev}
          className="absolute start-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-colors hover:bg-white"
          aria-label="Previous"
        >
          <ChevronLeft size={20} className="text-dark rtl:rotate-180" />
        </button>
      )}

      {/* Next arrow */}
      {currentIndex < stories.length - 1 && !commentsOpen && (
        <button
          onClick={goNext}
          className="absolute end-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-colors hover:bg-white"
          aria-label="Next"
        >
          <ChevronRight size={20} className="text-dark rtl:rotate-180" />
        </button>
      )}

      {/* Story container */}
      <div className="relative flex h-[90vh] max-h-[800px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl">
        {/* Story media */}
        {mediaUrl && isVideo ? (
          <video
            key={story.id}
            ref={videoRef}
            src={mediaUrl}
            muted={muted}
            playsInline
            autoPlay={!effectivePaused}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : mediaUrl ? (
          <Image
            src={mediaUrl}
            alt={caption || vendorName}
            fill
            className="object-cover"
            sizes="420px"
            priority
          />
        ) : null}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

        {/* ===== Top section ===== */}
        <div className="relative z-10 p-3">
          {/* Progress bar */}
          <div className="mb-3 flex gap-1">
            {stories.map((_, i) => (
              <div
                key={i}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <div
                  className="h-full rounded-full bg-white transition-all duration-100"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Vendor info row */}
          <div className="flex items-center gap-2.5">
            {vendorLogo ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white">
                <Image
                  src={vendorLogo}
                  alt={vendorName}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-sm font-bold text-dark">
                {vendorName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-bold text-white">
                  {vendorName}
                </span>
                <BadgeCheck
                  size={16}
                  className="shrink-0 fill-blue-500 text-white"
                />
              </div>
              <p className="text-[11px] text-white/70">
                {story.viewCount.toLocaleString()} {t("views")}
              </p>
            </div>

            {isVideo && (
              <button
                onClick={() => setMuted((m) => !m)}
                className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
              >
                {muted ? <VolumeOff size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            <button
              onClick={togglePause}
              className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>

            <button className="rounded-full border border-white px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-dark">
              {t("follow")}
            </button>
          </div>
        </div>

        {/* ===== Bottom section ===== */}
        <div className="relative z-10 mt-auto space-y-2 p-3">
          {/* Caption */}
          {caption && (
            <p className="text-xs text-white/90 line-clamp-2">{caption}</p>
          )}

          {/* Linked product card */}
          {linkedProduct && (
            <div className="overflow-hidden rounded-xl shadow-lg bg-white/70 p-2.5 backdrop-blur-sm h-max">
              {/* Top half — translucent */}
              <div className="flex gap-2.5  ">
                {productImage && (
                  <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={getMediaUrl(productImage) || ""}
                      alt={productName || ""}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {/* Name + rating */}
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-sm font-bold text-dark">
                      {productName}
                    </h4>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <span className="text-xs font-semibold text-dark">
                        {Number(linkedProduct.averageRating).toFixed(1)}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={
                              i <
                              Math.floor(Number(linkedProduct.averageRating))
                                ? "fill-star text-star"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-text">
                        ({linkedProduct.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {productDesc && (
                    <p className="mt-0.5 text-[11px] leading-tight text-gray-text line-clamp-2">
                      {productDesc}
                    </p>
                  )}
                </div>
              </div>
              {/* Price + Add to Cart — full opacity */}
              <div className="flex items-center justify-between bg-white px-2.5 py-2  mt-2 m rounded-xl">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-dark" dir="ltr">
                    <SaudiRiyal className="inline-block h-[1em] w-[1em] align-middle" aria-hidden="true" />{" "}
                    {productPrice.toFixed(1)}
                  </span>
                  {productOriginalPrice && (
                    <span className="text-[11px] text-gray-text line-through">
                      {productOriginalPrice.toFixed(1)}
                    </span>
                  )}
                  {productDiscount && (
                    <span className="text-[11px] font-semibold text-discount">
                      -{productDiscount}%
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  className="rounded-sm bg-dark px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-dark/90"
                >
                  {tProduct("addToCart")}
                </button>
              </div>
            </div>
          )}

          {/* Last 2 comments preview */}
          {recentComments.length > 0 && (
            <div className="space-y-1">
              {recentComments.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCommentsOpen(true)}
                  className="flex w-full items-center gap-2 text-start"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[8px] font-bold text-white">
                    {c.user.firstName?.charAt(0) ?? "?"}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-[11px] text-white/80">
                    <span className="font-semibold text-white">
                      {c.user.firstName ?? "User"}
                    </span>{" "}
                    {c.content}
                  </p>
                </button>
              ))}
              {commentCount > 2 && (
                <button
                  onClick={() => setCommentsOpen(true)}
                  className="text-[11px] font-medium text-white/50 hover:text-white/70"
                >
                  {t("viewAllComments", { count: commentCount })}
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {/* Comment input row */}
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                  onFocus={() => {
                    if (!isLoggedIn) setCommentsOpen(true);
                  }}
                  placeholder={t("addComment")}
                  className="min-w-0 flex-1 bg-transparent px-4 py-2 text-xs text-white outline-none placeholder:text-white/50"
                />
                {commentText.trim() && (
                  <button
                    onClick={handleSubmitComment}
                    disabled={submittingComment}
                    className="pe-3 text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Like + Share row */}
            <div className="flex items-center gap-3 pt-0.5">
              {/* Like */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-white cursor-pointer"
              >
                <Heart
                  size={22}
                  className={`transition-colors ${liked ? "fill-discount text-discount" : "text-white hover:text-discount"}`}
                />
                {likeCount > 0 && (
                  <span
                    className={`text-xs font-medium ${liked ? "text-discount" : ""}`}
                  >
                    {likeCount}
                  </span>
                )}
              </button>

              {/* Share */}
              <button className="text-white transition-colors hover:text-white/80">
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Comments full drawer */}
        {commentsOpen && (
          <StoryComments
            storyId={story.id}
            onClose={() => setCommentsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
