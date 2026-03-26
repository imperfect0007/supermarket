/**
 * Human-readable labels for API enum values (DB stores lowercase).
 */
export type OrderStatusApi = "pending" | "delivered" | "cancelled";

const ORDER_STATUS_LABELS: Record<OrderStatusApi, string> = {
  pending: "Pending",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Maps backend order status to Title Case for UI. */
export function formatOrderStatus(status: string): string {
  if (status in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[status as OrderStatusApi];
  }
  return status;
}
