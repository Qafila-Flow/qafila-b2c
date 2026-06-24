"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import CartItemRow from "@/components/cart/CartItemRow";
import OrderSummary from "@/components/cart/OrderSummary";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { items, summary, loading, itemCount } = useCart();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-border border-t-primary" />
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
        <Image
          src="/images/bag.png"
          alt=""
          width={330}
          height={250}
          className="mb-8"
          priority
        />
        <h1 className="mb-3 text-2xl font-bold text-dark dark:text-gray-100">
          {t("cart.empty")}
        </h1>
        <p className="mb-8 max-w-md text-center text-gray-text">
          {t("cart.emptyDescription")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <ShoppingBag size={18} />
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="mx-auto max-w-360 px-4 py-8 sm:px-6">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-gray-100">
          {t("cart.title")}{" "}
          <span className="text-base font-normal text-gray-text">
            (
            {itemCount > 1
              ? t("cart.items", { count: itemCount })
              : t("cart.item", { count: itemCount })}
            )
          </span>
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-gray-border dark:divide-gray-700 rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} locale={locale} />
            ))}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary summary={summary!} />
        </div>
      </div>
    </div>
  );
}
