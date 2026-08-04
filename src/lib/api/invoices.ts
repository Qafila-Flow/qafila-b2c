import apiClient from "./client";

/**
 * The invoice PDF is rendered by the backend (`GET /v1/invoices/orders/:id`)
 * rather than in the browser, so the storefront, the admin tools and the
 * mobile app all hand the customer byte-identical documents.
 */
export async function downloadInvoice(
  orderId: string,
  locale: string,
): Promise<Blob> {
  // The response interceptor unwraps `response.data`, which is the Blob here.
  return apiClient.get(`/invoices/orders/${orderId}`, {
    params: { locale: locale === "ar" ? "ar" : "en" },
    responseType: "blob",
  }) as unknown as Promise<Blob>;
}

/**
 * Fetch the invoice and hand it to the browser as a download.
 *
 * Goes through the API client rather than pointing an <a href> at the endpoint
 * because the route is JWT-guarded — a plain link sends no Authorization
 * header and would come back 401.
 */
export async function saveInvoice(
  orderId: string,
  orderNumber: string,
  locale: string,
): Promise<void> {
  const blob = await downloadInvoice(orderId, locale);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `qafila-invoice-${orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoking immediately can cancel the download in some browsers; give the
    // navigation a tick to start.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
