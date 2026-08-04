"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  BadgeCheck,
  Check,
  Home,
  MapPin,
  Package,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import SarIcon from "@/components/shared/SarIcon";
import { getMediaUrl } from "@/lib/utils";
import DownloadInvoiceButton from "@/components/orders/DownloadInvoiceButton";
import type { OrderItemResponse, OrderResponse } from "@/types/order";

/**
 * Post-purchase confirmation.
 *
 * The page is built around the one thing that makes a Qafila order different
 * from a single-store checkout: it splits into a *caravan* of vendor
 * shipments. Each shipment is a numbered stop on a route rail, because the
 * count is information the customer needs — two shipments means two deliveries
 * arriving separately, not one parcel.
 *
 * The rail, the numbering and the sand band are all built with logical
 * properties so the whole layout mirrors in Arabic without a second stylesheet.
 */
export default function OrderConfirmation({ order }: { order: OrderResponse }) {
  const t = useTranslations();
  const locale = useLocale();

  const addr = order.shippingAddress;
  const shipments = order.vendorOrders;
  const itemCount = shipments
    .flatMap((vo) => vo.items)
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="pb-16">
      {/* ── Sand band ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/12 via-primary/5 to-transparent dark:from-primary/12 dark:via-primary/[0.04] dark:to-transparent">
        {/* The same dune curve the PDF invoice uses, so the confirmation and
            the document the customer downloads read as one family. It is
            filled with the page background, so the curve *is* the bottom edge
            of the sand band — otherwise the tint stops on a hard straight line. */}
        <svg
          className="pointer-events-none absolute inset-x-0 -bottom-px h-24 w-full text-white dark:text-[#0f0f0f]"
          viewBox="0 0 1440 416"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M-73 270.696V496H1488.16V164.353C1507.66 182.738 1534.96 185.982 1488.16 51.8814C1429.65 -115.745 1195.63 173.726 1088.62 205.088C981.606 236.45 917.599 139.479 797.587 143.445C677.575 147.41 550.563 225.996 405.048 205.088C288.636 188.361 37.8445 241.857 -73 270.696Z"
          />
        </svg>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-10 pb-14 text-center sm:px-6">
          <Image
            src="/images/empty-cart.svg"
            alt=""
            width={260}
            height={208}
            priority
            /* The artwork is light line-art on transparent; at full strength
               its near-white cart body glares against the dark theme. */
            className="fade-rise mb-6 h-auto w-44 sm:w-56 dark:opacity-40"
          />

          {/* Payment state, not order state — the headline already says the
              order landed, so this chip carries information it doesn't. */}
          {order.paymentStatus === "PAID" && (
            <p className="fade-rise flex items-center gap-2 text-xs font-semibold text-primary-hover ltr:tracking-[0.18em] ltr:uppercase dark:text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green text-white">
                <Check size={12} strokeWidth={3} />
              </span>
              {t("checkout.paid")}
            </p>
          )}

          <h1
            className="fade-rise mt-3 text-3xl font-bold text-balance text-dark sm:text-4xl dark:text-gray-50"
            style={{ animationDelay: "60ms" }}
          >
            {t("checkout.orderPlaced")}
          </h1>

          <p
            className="fade-rise mt-3 max-w-md text-sm text-gray-text"
            style={{ animationDelay: "120ms" }}
          >
            {t("checkout.orderConfirmation")}
          </p>

          {/* The order number is the one string the customer will read back to
              support, so it gets the weight — always Latin digits, always LTR. */}
          <div
            className="fade-rise mt-6 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-white/70 px-5 py-2.5 backdrop-blur-sm dark:border-primary/25 dark:bg-white/5"
            style={{ animationDelay: "180ms" }}
          >
            <span className="text-xs text-gray-text">
              {t("checkout.orderNumber")}
            </span>
            <span
              dir="ltr"
              className="font-mono text-sm font-bold tracking-tight text-dark tabular-nums dark:text-gray-100"
            >
              {order.orderNumber}
            </span>
          </div>

          {/* Facts rail — three things worth knowing at a glance. */}
          <dl
            className="fade-rise mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-text"
            style={{ animationDelay: "240ms" }}
          >
            <Fact
              label={t("checkout.placedOn")}
              value={formatDate(order.createdAt, locale)}
            />
            <Divider />
            <Fact label={t("checkout.itemsLabel")} value={String(itemCount)} />
            <Divider />
            <Fact
              label={t("checkout.shipments")}
              value={String(shipments.length)}
            />
          </dl>

          <div
            className="fade-rise mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "300ms" }}
          >
            {/* An invoice only exists once payment settles — before that the
                document would be a quote, not a tax invoice. */}
            {order.paymentStatus === "PAID" && (
              <DownloadInvoiceButton
                orderId={order.id}
                orderNumber={order.orderNumber}
                variant="solid"
                className="sm:w-56"
              />
            )}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full border-2 border-dark px-6 py-3 text-sm font-semibold text-dark transition-colors hover:bg-dark hover:text-white sm:w-56 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-100 dark:hover:text-dark"
            >
              <Home size={16} />
              {t("checkout.goHome")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Shipments as stops on a route.
            `min-w-0` is load-bearing: a grid item defaults to min-width:auto,
            so the nowrap of the `truncate` product titles would otherwise set
            the track's minimum to the full untruncated string and push the
            whole page into horizontal scroll on mobile. */}
        <section className="min-w-0">
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-dark dark:text-gray-100">
            <Package size={18} className="text-primary" />
            {t("checkout.yourShipments")}
          </h2>

          <ol className="relative space-y-4">
            {/* The route line. Sits under the markers, inset to their centre. */}
            {shipments.length > 1 && (
              <span
                aria-hidden="true"
                className="absolute inset-y-4 start-4 w-px -translate-x-1/2 border-s border-dashed border-primary/35 rtl:translate-x-1/2 dark:border-primary/25"
              />
            )}

            {shipments.map((vo, i) => (
              <li key={vo.id} className="relative ps-12">
                <span className="absolute start-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-white text-xs font-bold text-primary-hover tabular-nums dark:border-primary/30 dark:bg-dark dark:text-primary">
                  {i + 1}
                </span>

                <article className="overflow-hidden rounded-2xl border border-gray-border bg-white dark:border-gray-700 dark:bg-dark">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-border bg-gray-light/60 px-5 py-3 dark:border-gray-700 dark:bg-white/[0.03]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-dark dark:text-gray-100">
                        {locale === "ar"
                          ? vo.vendor.storeNameAr
                          : vo.vendor.storeName}
                      </span>
                      {vo.vendor.isVerified && (
                        <BadgeCheck
                          size={15}
                          className="shrink-0 text-green"
                          aria-label={t("vendor.verified")}
                        />
                      )}
                    </div>
                    {shipments.length > 1 && (
                      <span className="shrink-0 text-[11px] text-gray-text ltr:tracking-wider ltr:uppercase">
                        {t("checkout.shipmentOf", {
                          index: i + 1,
                          total: shipments.length,
                        })}
                      </span>
                    )}
                  </header>

                  <ul className="divide-y divide-gray-border dark:divide-gray-700">
                    {vo.items.map((item) => (
                      <ItemRow key={item.id} item={item} locale={locale} />
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </section>

        {/* Summary + destination */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-40 lg:self-start">
          <section className="rounded-2xl border border-gray-border bg-white p-5 dark:border-gray-700 dark:bg-dark">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-dark dark:text-gray-100">
              <Receipt size={16} className="text-primary" />
              {t("orders.paymentSummary")}
            </h2>

            <dl className="space-y-2.5 text-sm">
              <Money label={t("orders.subtotal")} value={order.subtotal} />
              {order.discount > 0 && (
                <Money
                  label={t("orders.savingsDiscounts")}
                  value={order.discount}
                  negative
                />
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-text">{t("orders.shippingFee")}</dt>
                <dd className="font-medium text-green" dir="ltr">
                  {order.shippingFee > 0 ? (
                    <>
                      <SarIcon /> {money(order.shippingFee)}
                    </>
                  ) : (
                    t("orders.free")
                  )}
                </dd>
              </div>
              <Money label={t("cart.vat")} value={order.tax} />

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-border pt-3 dark:border-gray-700">
                <dt className="font-bold text-dark dark:text-gray-100">
                  {t("orders.totalVatIncluded")}
                  <span className="block text-[11px] font-normal text-gray-text">
                    {t("orders.vatIncluded")}
                  </span>
                </dt>
                <dd
                  className="text-lg font-bold text-dark tabular-nums dark:text-gray-100"
                  dir="ltr"
                >
                  <SarIcon /> {money(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-border bg-white p-5 dark:border-gray-700 dark:bg-dark">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-dark dark:text-gray-100">
              <MapPin size={16} className="text-primary" />
              {t("orders.deliveryAddress")}
            </h2>

            <dl className="space-y-2.5 text-sm">
              <AddressLine icon={User}>
                {addr.firstName} {addr.lastName}
              </AddressLine>
              <AddressLine icon={Phone} ltr>
                {addr.phoneNumber}
              </AddressLine>
              <AddressLine icon={MapPin}>
                {[addr.street, addr.area, addr.city, addr.apartmentNo]
                  .filter(Boolean)
                  .join(locale === "ar" ? "، " : ", ")}
              </AddressLine>
            </dl>
          </section>

          <Link
            href="/profile/orders"
            className="block rounded-full py-2 text-center text-sm font-medium text-primary hover:underline"
          >
            {t("checkout.viewOrders")}
          </Link>
        </aside>
      </div>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  locale,
}: {
  item: OrderItemResponse;
  locale: string;
}) {
  const title = locale === "ar" ? item.productTitleAr : item.productTitle;
  const v = item.variantDetails;

  const variant = [
    v?.color ? (locale === "ar" && v.colorAr ? v.colorAr : v.color) : null,
    v?.size ? (locale === "ar" && v.sizeAr ? v.sizeAr : v.size) : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="relative h-18 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-light dark:bg-white/5">
        {item.productImage ? (
          <Image
            src={getMediaUrl(item.productImage) || item.productImage}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Package size={18} className="text-gray-text" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* line-clamp rather than truncate: on a narrow screen a single
            ellipsised line hides which product this actually is. */}
        <p className="line-clamp-2 text-sm font-semibold text-dark dark:text-gray-100">
          {title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-text">
          {v?.colorHex && (
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15 dark:ring-white/20"
              style={{ backgroundColor: v.colorHex }}
            />
          )}
          {variant.join(" · ")}
          {variant.length > 0 && <span aria-hidden="true">·</span>}
          <span dir="ltr" className="tabular-nums">
            ×{item.quantity}
          </span>
        </p>
      </div>

      <p
        className="shrink-0 text-sm font-bold text-dark tabular-nums dark:text-gray-100"
        dir="ltr"
      >
        <SarIcon /> {money(item.subtotal)}
      </p>
    </li>
  );
}

function Money({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-text">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${negative ? "text-primary" : "text-dark dark:text-gray-200"}`}
        dir="ltr"
      >
        {negative && "- "}
        <SarIcon /> {money(value)}
      </dd>
    </div>
  );
}

function AddressLine({
  icon: Icon,
  ltr = false,
  children,
}: {
  icon: typeof MapPin;
  ltr?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-gray-text" />
      <span
        className="text-dark dark:text-gray-300"
        {...(ltr ? { dir: "ltr" as const } : {})}
      >
        {children}
      </span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt>{label}</dt>
      <dd className="font-semibold text-dark tabular-nums dark:text-gray-200">
        {value}
      </dd>
    </div>
  );
}

function Divider() {
  return (
    <span aria-hidden="true" className="h-3 w-px bg-gray-border dark:bg-gray-700" />
  );
}

/**
 * Gregorian calendar with Western digits in both locales — plain `ar-SA`
 * would switch to the Hijri calendar and Arabic-Indic numerals.
 */
function formatDate(iso: string, locale: string): string {
  const tag = locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Grouped to thousands, always Western digits — matches the amounts printed on
 * the PDF invoice the customer downloads from this page.
 */
function money(value: number | string): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}
