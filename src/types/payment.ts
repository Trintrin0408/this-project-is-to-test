// docs/api/11-payments-settlement.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06. Mô hình
// 2 tầng PaymentRequest→Payment (kèm VNPAY_QR/paymentUrl) đã bị XOÁ HẲN. Backend mới chỉ có 1 bảng
// phẳng `Deposit` (ghi nhận cọc), không có cổng thanh toán online — xem docs/more-require.md.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model Deposit), order.route.ts,
// deposit.route.ts, order.validator.ts.

export type DepositStatus = 'PENDING' | 'SUCCESS' | 'OVERDUE' | 'CANCELLED';

// GET /api/v1/orders/:id/deposits
export interface Deposit {
  depositId: string;
  depositCode: string;
  orderId: string;
  amount: number;
  dueDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  qrCodeUrl?: string;
  status: DepositStatus;
  evidenceId?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/orders/:id/deposits
export interface CreateOrderDepositPayload {
  amount: number;
  paymentMethod?: string;
  notes?: string;
}

// PUT /api/v1/deposits/:id — khi status=SUCCESS, backend tự set approvedBy/approvedAt/paymentDate
// và cập nhật Order.paymentStatus = DEPOSITED
export interface UpdateDepositStatusPayload {
  status: DepositStatus;
  notes?: string;
}
