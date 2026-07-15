// Nhãn hiển thị cho trạng thái Order — theo enum thật của backend (prisma/schema.prisma enum
// OrderStatus, 5 giá trị UPPERCASE sau đợt refactor 2026-07-06). Trạng thái cọc/quyết toán KHÔNG
// còn là giá trị của orderStatus — xem Order.paymentStatus (types/order.ts) + Deposit/Settlement
// status riêng (types/payment.ts, types/settlement.ts).
export const ORDER_STATUS_LABEL: Record<string, string> = {
  NEW: 'Mới',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const ORDER_PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  DEPOSITED: 'Đã cọc',
  PAID: 'Đã thanh toán',
};
