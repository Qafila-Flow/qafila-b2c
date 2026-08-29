"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  MapPin,
  StickyNote,
  ChevronRight,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { getAddresses, type Address } from "@/lib/api/addresses";
import { checkout } from "@/lib/api/orders";
import Image from "next/image";
import { getMediaUrl } from "@/lib/utils";
import SarIcon from "@/components/shared/SarIcon";

export default function CheckoutPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { items, summary } = useCart();
  const { isLoggedIn } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch addresses
  useEffect(() => {
    if (!isLoggedIn) {
      setAddressLoading(false);
      return;
    }
    getAddresses()
      .then((res) => {
        setAddresses(res.addresses);
        const defaultAddr =
          res.defaultAddress || res.addresses.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      })
      .catch(() => {})
      .finally(() => setAddressLoading(false));
  }, [isLoggedIn]);


  // Redirect if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
        <ShoppingBag size={48} className="mb-4 text-gray-text" />
        <p className="mb-6 text-lg text-gray-text">
          {t("checkout.loginRequired")}
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
        {/* Same asset as the empty state on the cart page. */}
        <Image
          src="/images/bag.png"
          alt=""
          width={330}
          height={250}
          priority
          className="mb-6 h-auto w-64"
        />
        <p className="mb-6 text-lg text-gray-text">
          {t("checkout.emptyCart")}
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  /**
   * Create the order, then hand off to the card step.
   *
   * The order is created here and stays PENDING until money actually arrives,
   * so a declined card, a closed tab or a back button never loses it — the
   * customer returns to /checkout/payment for the same order rather than
   * rebuilding a cart. The cart is emptied server-side when the payment
   * settles, not here.
   */
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return;
    setLoading(true);
    setError("");

    try {
      const createdOrder = await checkout({
        addressId: selectedAddressId,
        notes: notes || undefined,
        idempotencyKey: crypto.randomUUID(),
      });

      router.push(`/checkout/payment?orderId=${createdOrder.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("checkout.paymentFailed"),
      );
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="mx-auto max-w-360 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-gray-100">
        {t("checkout.title")}
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column - Checkout form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shipping address */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-dark dark:text-gray-100">
                {t("checkout.shippingAddress")}
              </h2>
            </div>

            {addressLoading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-border dark:border-gray-700 border-t-primary dark:border-t-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-4 text-center">
                <p className="mb-3 text-sm text-gray-text">
                  {t("checkout.noAddresses")}
                </p>
                <Link
                  href="/profile/addresses"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Plus size={16} />
                  {t("checkout.addAddress")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-border hover:border-gray-text dark:border-gray-700 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-dark dark:text-gray-100">
                          {addr.firstName} {addr.lastName}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {t("addresses.default")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-text">
                        {addr.street}, {addr.area},{" "}
                        {/* Prefer the canonical bilingual name; fall back to the
                            stored free text on legacy, unmapped addresses. */}
                        {(locale === "ar" ? addr.cityNameAr : addr.cityNameEn) ??
                          addr.city}
                      </p>
                      <p className="text-sm text-gray-text">
                        {addr.phoneNumber}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Order notes */}
          <div className="rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <div className="mb-4 flex items-center gap-2">
              <StickyNote size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-dark dark:text-gray-100">
                {t("checkout.orderNotes")}
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("checkout.notesPlaceholder")}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-3 text-sm text-dark dark:text-gray-200 outline-none transition-colors placeholder:text-gray-text dark:placeholder:text-gray-500 focus:border-primary"
            />
          </div>

        </div>

        {/* Right column - Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-40 rounded-xl border border-gray-border dark:border-gray-700 bg-white dark:bg-dark p-6">
            <h2 className="mb-4 text-lg font-bold text-dark dark:text-gray-100">
              {t("checkout.orderSummary")}
            </h2>

            {/* Mini item list */}
            <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-gray-light dark:bg-white/5">
                    {item.productImage ? (
                      <Image
                        src={getMediaUrl(item.productImage) || item.productImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-gray-text">
                        img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 truncate text-xs text-dark dark:text-gray-200">
                    {locale === "ar"
                      ? item.productTitleAr
                      : item.productTitle}
                    <span className="text-gray-text"> x{item.quantity}</span>
                  </div>
                  <span className="shrink-0 text-xs font-medium" dir="ltr">
                    <SarIcon /> {item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-border dark:border-gray-700 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-text">{t("cart.subtotal")}</span>
                <span dir="ltr">
                  <SarIcon /> {summary!.totalBeforeTax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-text">{t("cart.vat")}</span>
                <span dir="ltr">
                  <SarIcon /> {summary!.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-border dark:border-gray-700 pt-2">
                <span className="font-bold text-dark dark:text-gray-100">{t("cart.total")}</span>
                <span className="font-bold text-dark dark:text-gray-100" dir="ltr">
                  <SarIcon /> {summary!.total.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-discount/10 p-3 text-sm text-discount">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddressId}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? t("checkout.placing") : t("checkout.continueToPayment")}
              {!loading && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
