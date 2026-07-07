"use client";

import { useTranslations } from "next-intl";
import { PackageSearch } from "lucide-react";
import ProductCard from "@/components/shared/ProductCard";
import type { Product } from "@/components/shared/ProductCard";

interface ProductGridProps {
  products: Product[];
  isPending?: boolean;
}

export default function ProductGrid({ products, isPending }: ProductGridProps) {
  const t = useTranslations("categoryPage.filters");

  if (products.length === 0 && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch size={48} className="mb-4 text-gray-400 dark:text-gray-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("noResults")}
        </h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          {t("noResultsDescription")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
        isPending ? "opacity-50 transition-opacity" : ""
      }`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant="grid" />
      ))}
    </div>
  );
}
