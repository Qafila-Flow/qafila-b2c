export type OrderStatus =
  | "PENDING"
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type CancellationReason =
  | "CHANGED_MIND"
  | "NO_LONGER_NEEDED"
  | "BELIEVE_FAKE"
  | "NO_REASON"
  | "OTHER";

export interface CheckoutDto {
  addressId: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productTitle: string;
  productTitleAr: string;
  productImage?: string | null;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  status: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  variantDetails: {
    color?: string;
    colorAr?: string;
    colorHex?: string;
    size?: string;
    sizeAr?: string;
  } | null;
}

export interface VendorInfo {
  id: string;
  storeName: string;
  storeNameAr: string;
  slug: string;
  logo: string | null;
  isVerified: boolean;
  approvalStatus: string;
}

export type StatusActor = "SYSTEM" | "VENDOR" | "ADMIN" | "CUSTOMER";

/** One transition in a shipment's life. The source of real timeline dates. */
export interface ShipmentStatusEvent {
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  actorType: StatusActor;
  reason?: string;
  createdAt: string;
}

export interface VendorOrderResponse {
  id: string;
  vendorId: string;
  /**
   * Optional: the API omits this on any order path that doesn't include the
   * vendor relation. Declaring it required hid a real runtime crash, so treat
   * it as absent-until-proven-present at every call site.
   */
  vendor?: VendorInfo;
  vendorOrderNumber: string;
  /**
   * This shipment's own status — the authoritative one.
   *
   * `OrderResponse.status` is a rollup across all shipments (the least
   * advanced live one), so it answers "is the whole order done?". Anything
   * about ONE vendor's parcel — its timeline, whether it can still be
   * cancelled, its tracking number — reads this instead.
   */
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  /** Per shipment: a caravan travels as several parcels, often several couriers. */
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  statusEvents?: ShipmentStatusEvent[];
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  street: string;
  city: string;
  area: string;
  apartmentNo: string | null;
  directions: string | null;
}

export interface OrderResponse {
  id: string;
  userId: string;
  orderNumber: string;
  /**
   * Rollup across the shipments: the least advanced live one, or CANCELLED /
   * REFUNDED once they have all stopped.
   *
   * Use it for the order-level badge and the list tabs. Do NOT use it to
   * decide whether something can be cancelled — that is per shipment, and
   * reading this field for it is exactly how a delivered order stayed
   * cancellable.
   */
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  vendorOrders: VendorOrderResponse[];
  /**
   * Shipment numbers a cancellation could not touch because they had already
   * shipped. Cancelling a multi-vendor order is normally a partial success.
   */
  notCancelled?: string[];
  createdAt: string;
  updatedAt: string;
}
