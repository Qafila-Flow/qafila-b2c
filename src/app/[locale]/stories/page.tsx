import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { getExploreStories } from "@/lib/api/stories";
import StoriesPageClient from "@/components/stories/StoriesPageClient";
import type { GroupedStories } from "@/types/story";

export default async function StoriesPage() {
  const t = await getTranslations("stories");
  const tCat = await getTranslations("categoryPage");

  let groupedStories: GroupedStories[] = [];
  try {
    const res = await getExploreStories(1, 50);
    groupedStories = res.data;
  } catch {
    // API not available yet - will show empty state
  }

  return (
    <div className="mx-auto max-w-360 px-6 py-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 py-3">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-text dark:text-gray-400">
          <li>
            <Link href="/" className="hover:text-primary">
              {tCat("home")}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="font-medium text-dark dark:text-gray-100">{t("title")}</span>
          </li>
        </ol>
      </nav>

      {/* Page title */}
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-gray-100">{t("title")}</h1>

      {/* Stories grid */}
      <StoriesPageClient groupedStories={groupedStories} />
    </div>
  );
}
