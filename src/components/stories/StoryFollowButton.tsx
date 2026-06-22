"use client";

import { useTranslations } from "next-intl";
import { useFollowVendor } from "@/lib/hooks/useFollowVendor";

interface StoryFollowButtonProps {
  vendorId: string;
  initialFollowing?: boolean;
}

/**
 * Follow button for the story overlay. The viewer cycles through stories from
 * many vendors within a single mount, so callers should pass a `key` that
 * changes with the vendor (and its follow state) to re-initialize the hook.
 * Like the story like action, following while logged out is a silent no-op.
 */
export default function StoryFollowButton({
  vendorId,
  initialFollowing,
}: StoryFollowButtonProps) {
  const t = useTranslations("stories");
  const { isFollowing, loading, toggleFollow } = useFollowVendor({
    vendorId,
    initialFollowing: initialFollowing ?? false,
  });

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`rounded-full border border-white px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-white text-dark"
          : "text-white hover:bg-white hover:text-dark"
      }`}
    >
      {isFollowing ? t("following") : t("follow")}
    </button>
  );
}
