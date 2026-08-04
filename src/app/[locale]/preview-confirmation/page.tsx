"use client";

// TEMPORARY design-review harness for OrderConfirmation. Delete after review.
import OrderConfirmation from "@/components/orders/OrderConfirmation";
import type { OrderResponse } from "@/types/order";

const IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 72"><rect width="56" height="72" fill="#E8983A"/><circle cx="28" cy="36" r="14" fill="#fff" opacity=".5"/></svg>',
  );

const ORDER = {
  id: "11111111-1111-1111-1111-111111111111",
  userId: "u1",
  orderNumber: "ORD-20260804-4821",
  status: "PLACED",
  paymentStatus: "PAID",
  subtotal: 2907,
  shippingFee: 0,
  tax: 413.55,
  discount: 150,
  total: 3170.55,
  trackingNumber: null,
  notes: null,
  cancellationReason: null,
  cancelledAt: null,
  createdAt: "2026-08-04T08:05:00Z",
  updatedAt: "2026-08-04T08:05:00Z",
  shippingAddress: {
    firstName: "Mohammed",
    lastName: "Alharbi",
    phoneNumber: "+966 55 123 4567",
    street: "Olaya Street",
    city: "Riyadh",
    area: "Al Malqa",
    apartmentNo: "12",
    directions: null,
  },
  vendorOrders: [
    {
      id: "vo1",
      vendorId: "v1",
      vendorOrderNumber: "VO-20260804-4821-1",
      status: "PLACED",
      subtotal: 1027,
      tax: 154.05,
      total: 1181.05,
      createdAt: "2026-08-04T08:05:00Z",
      updatedAt: "2026-08-04T08:05:00Z",
      vendor: {
        id: "v1",
        storeName: "Dar Al Naseej",
        storeNameAr: "دار النسيج",
        slug: "dar-al-naseej",
        logo: null,
        isVerified: true,
        approvalStatus: "APPROVED",
      },
      items: [
        {
          id: "i1",
          productId: "p1",
          productTitle: "Classic Abaya with gold thread embroidery",
          productTitleAr: "عباية كلاسيكية مطرزة بخيوط ذهبية",
          productImage: IMG,
          sku: "ABY-1043-BLK",
          price: 649,
          quantity: 1,
          subtotal: 649,
          status: "ACTIVE",
          cancellationReason: null,
          cancelledAt: null,
          variantDetails: {
            color: "Black",
            colorAr: "أسود",
            colorHex: "#1a1a1a",
            size: "M",
            sizeAr: "M",
          },
        },
        {
          id: "i2",
          productId: "p2",
          productTitle: "Printed silk shawl",
          productTitleAr: "شال حريري مطبوع",
          productImage: IMG,
          sku: "SHW-2210-SND",
          price: 189,
          quantity: 2,
          subtotal: 378,
          status: "ACTIVE",
          cancellationReason: null,
          cancelledAt: null,
          variantDetails: {
            color: "Sand",
            colorAr: "رملي",
            colorHex: "#EDAD63",
            size: null,
            sizeAr: null,
          },
        },
      ],
    },
    {
      id: "vo2",
      vendorId: "v2",
      vendorOrderNumber: "VO-20260804-4821-2",
      status: "PLACED",
      subtotal: 1880,
      tax: 282,
      total: 2162,
      createdAt: "2026-08-04T08:05:00Z",
      updatedAt: "2026-08-04T08:05:00Z",
      vendor: {
        id: "v2",
        storeName: "Rimal Perfumes",
        storeNameAr: "عطور الرمال",
        slug: "rimal",
        logo: null,
        isVerified: false,
        approvalStatus: "APPROVED",
      },
      items: [
        {
          id: "i3",
          productId: "p3",
          productTitle: "Aged Cambodian oud — 12 years",
          productTitleAr: "عود كمبودي معتق 12 سنة",
          productImage: null,
          sku: "OUD-5512-12Y",
          price: 1250,
          quantity: 1,
          subtotal: 1250,
          status: "ACTIVE",
          cancellationReason: null,
          cancelledAt: null,
          variantDetails: null,
        },
      ],
    },
  ],
} as unknown as OrderResponse;

export default function PreviewConfirmationPage() {
  return <OrderConfirmation order={ORDER} />;
}
