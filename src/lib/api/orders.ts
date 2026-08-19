import apiClient from "./client";
import type { CheckoutDto, OrderResponse } from "@/types/order";


export async function checkout(dto: CheckoutDto): Promise<OrderResponse> {
  return apiClient.post("/orders/checkout", dto);
}

export interface OrdersListResponse {
  data: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  /**
   * Several statuses in ONE request.
   *
   * The "active" tab spans five of them. It used to fire five parallel
   * requests and stitch the pages together client-side, which meant
   * pagination silently broke as soon as a customer had more than one page of
   * any single status.
   */
  statuses?: string[];
  paymentStatus?: string;
}): Promise<OrdersListResponse> {
  const { statuses, ...rest } = params ?? {};
  return apiClient.get("/orders", {
    params: {
      ...rest,
      ...(statuses?.length ? { statuses: statuses.join(",") } : {}),
    },
  });
}

export async function getOrder(orderId: string): Promise<OrderResponse> {
  return apiClient.get(`/orders/${orderId}`);
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  details?: string,
): Promise<OrderResponse> {
  return apiClient.put(`/orders/${orderId}/cancel`, { reason, details });
}

export async function cancelOrderItem(
  orderId: string,
  itemId: string,
  reason: string,
  details?: string,
): Promise<OrderResponse> {
  return apiClient.put(`/orders/${orderId}/items/${itemId}/cancel`, {
    reason,
    details,
  });
}
