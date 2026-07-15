"use client";

import { useLocale } from "next-intl";
import CategoryItem from "@/components/shared/CategoryItem";
import Carousel from "@/components/shared/Carousel";
import { useActiveCategory } from "@/lib/active-category-context";
import { getMediaUrl } from "@/lib/utils";

// Roots whose direct children are wrapper categories (e.g. saudi-brands →
// saudi-brands-1): show the wrapper's own subcategories instead of the wrapper.
const FLATTENED_ROOT_SLUGS = ["saudi-brands"];

export default function CategoryCarousel() {
  const locale = useLocale();
  const { activeRootSlug, categoryTree } = useActiveCategory();

  const activeRoot = categoryTree.find(
    (c) => c.parentId === null && c.slug === activeRootSlug,
  );

  const children = activeRoot?.children ?? [];

  const subcategories = FLATTENED_ROOT_SLUGS.includes(activeRootSlug)
    ? children.flatMap((c) => (c.children?.length ? c.children : [c]))
    : children;

  if (subcategories.length === 0) return null;

  return (
    <section className="mx-4 max-w-360 px-0 py-5 md:mx-20">
      <Carousel>
        <div className="flex gap-5 px-2 py-2">
          {subcategories.map((cat) => (
            <CategoryItem
              key={cat.slug}
              label={locale === "ar" ? cat.nameAr || cat.name : cat.name}
              href={`/categories/${cat.slug}`}
              image={getMediaUrl(cat.image) ?? null}
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}
