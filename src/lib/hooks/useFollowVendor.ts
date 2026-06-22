"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { followVendor, unfollowVendor } from "@/lib/api/vendors";

interface UseFollowVendorOptions {
  vendorId: string;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
  /** Called when an unauthenticated user tries to follow (e.g. open login modal). */
  onRequireLogin?: () => void;
}

/**
 * Shared follow/unfollow logic for vendor follow buttons.
 *
 * Updates optimistically and reconciles with the server, mirroring the
 * like-toggle pattern used elsewhere. The backend endpoints are idempotent
 * in practice — a duplicate follow returns 409 "Already following" and an
 * absent unfollow returns 404 "Not following". Those are treated as the
 * intended end state rather than errors, so callers that don't know the
 * initial `isFollowing` value (e.g. the product page banner) stay correct.
 */
export function useFollowVendor({
  vendorId,
  initialFollowing = false,
  initialFollowerCount = 0,
  onRequireLogin,
}: UseFollowVendorOptions) {
  const { isLoggedIn } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    if (loading) return;
    setLoading(true);

    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? Math.max(0, c - 1) : c + 1));

    try {
      if (wasFollowing) {
        await unfollowVendor(vendorId);
      } else {
        await followVendor(vendorId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      const alreadyInEndState =
        (!wasFollowing && message.includes("already following")) ||
        (wasFollowing && message.includes("not following"));
      // Genuine failure — revert the optimistic update.
      if (!alreadyInEndState) {
        setIsFollowing(wasFollowing);
        setFollowerCount((c) => (wasFollowing ? c + 1 : Math.max(0, c - 1)));
      }
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, followerCount, loading, toggleFollow };
}
