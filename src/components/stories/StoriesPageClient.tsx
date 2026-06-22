"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import StoryCard from "./StoryCard";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@/lib/auth-context";
import { getExploreStories } from "@/lib/api/stories";
import type { GroupedStories, Story } from "@/types/story";

interface StoriesPageClientProps {
  groupedStories: GroupedStories[];
}

export default function StoriesPageClient({
  groupedStories: initialGroupedStories,
}: StoriesPageClientProps) {
  const t = useTranslations("stories");
  const { isLoggedIn } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [groupedStories, setGroupedStories] = useState(initialGroupedStories);

  // The page is server-rendered without the user's token, so per-user fields
  // like `vendor.isFollowing` come back empty. Re-fetch on the client (the API
  // client attaches the token) to hydrate the follow state for story buttons.
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    getExploreStories(1, 50)
      .then((res) => {
        if (active) setGroupedStories(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // Flatten all stories for the grid and viewer navigation
  const allStories: Story[] = groupedStories.flatMap((g) => g.stories);

  const handleOpenStory = (storyIndex: number) => {
    setViewerIndex(storyIndex);
    setViewerOpen(true);
  };

  if (allStories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-gray-text">{t("empty")}</p>
        <p className="mt-1 text-sm text-gray-text">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Stories Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {allStories.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            onClick={() => handleOpenStory(index)}
          />
        ))}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && (
        <StoryViewer
          stories={allStories}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
