"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, Star, Store } from "lucide-react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";
import { useFollowVendor } from "@/lib/hooks/useFollowVendor";
import type { VendorProfile } from "@/lib/api/vendors";

function formatFollowers(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(count);
}

interface VendorHeaderProps {
  vendor: VendorProfile;
  locale: string;
  onRequireLogin: () => void;
}

export default function VendorHeader({
  vendor,
  locale,
  onRequireLogin,
}: VendorHeaderProps) {
  const t = useTranslations("vendor");

  const { isFollowing, followerCount, loading, toggleFollow } = useFollowVendor({
    vendorId: vendor.id,
    initialFollowing: vendor.isFollowing ?? false,
    initialFollowerCount: vendor.followerCount,
    onRequireLogin,
  });

  const storeName =
    locale === "ar" ? vendor.storeNameAr || vendor.storeName : vendor.storeName;
  const rating = vendor.rating ?? 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const logoUrl = getMediaUrl(vendor.logo);
  const bannerUrl = getMediaUrl(vendor.banner);

  return (
    <div>
      {/* Banner */}
      {bannerUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 sm:h-56">
          <Image
            src={bannerUrl}
            alt={storeName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
        </div>
      )}

      {/* Profile row */}
      <div className="flex flex-wrap items-center gap-4 py-5">
        {/* Logo */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-gray-700 bg-gray-100 dark:bg-gray-700 shadow-sm sm:h-20 sm:w-20">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <Store size={28} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold text-dark dark:text-gray-100 sm:text-xl">
              {storeName}
            </h1>
            {vendor.isVerified && (
              <BadgeCheck
                size={20}
                className="shrink-0 fill-blue-500 text-white"
              />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-text sm:text-sm">
            <span>{t("followers", { count: formatFollowers(followerCount) })}</span>
            {rating > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  {rating.toFixed(1)}
                  <span className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < fullStars
                            ? "fill-star text-star"
                            : i === fullStars && hasHalf
                              ? "fill-star/50 text-star"
                              : "text-gray-300"
                        }
                      />
                    ))}
                  </span>
                  <span className="text-gray-text">
                    ({vendor.reviewCount})
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Follow button */}
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`shrink-0 rounded-full px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
            isFollowing
              ? "border border-gray-border dark:border-gray-700 bg-white dark:bg-dark text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark/80"
              : "bg-dark text-white hover:bg-dark/90"
          }`}
        >
          {isFollowing ? t("following") : t("follow")}
        </button>
      </div>
    </div>
  );
}
