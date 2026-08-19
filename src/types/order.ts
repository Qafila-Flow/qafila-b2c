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
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
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
  createdAt: string;
  updatedAt: string;
}
