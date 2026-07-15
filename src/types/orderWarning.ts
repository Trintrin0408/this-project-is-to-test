// Model MỚI — không tồn tại ở backend trước đợt refactor 2026-07-06.
// D:\bnwems-backend-api: prisma/schema.prisma model OrderWarning, order.route.ts (get/create theo
// orderId), warning.route.ts (resolve theo warningId).

export interface OrderWarning {
  warningId: string;
  orderId: string;
  content: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

// POST /api/v1/orders/:id/warnings
export interface CreateOrderWarningPayload {
  content: string;
}
