// docs/api/09-orders.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06 (xem docs/more-require.md
// mục mới nhất). Field/endpoint dưới đây lấy trực tiếp từ D:\bnwems-backend-api
// (prisma/schema.prisma model Order, order.route.ts, order.validator.ts, order.service.ts).

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type OrderPaymentStatus = 'UNPAID' | 'DEPOSITED' | 'PAID';
export type OrderItemSource = 'INTERNAL' | 'SUPPLIER';

export interface OrderItem {
  orderItemId?: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  source: OrderItemSource;
  preparedQty?: number;
  notes?: string;
  item?: { itemName: string };
}

// GET /api/v1/orders
export interface Order {
  orderId: string;
  orderCode: string;
  customerId: string;
  quotationId?: string;
  policyId?: string;
  eventType: string;
  eventName?: string;
  eventDate: string;
  location: string;
  guestCount?: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  cancelReason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/v1/orders/:id — kèm include orderItems.item, orderWarnings, deposits, settlements
export interface OrderDetail extends Order {
  orderItems: OrderItem[];
  orderWarnings: OrderWarningSummary[];
  deposits: OrderDepositSummary[];
  settlements: OrderSettlementSummary[];
}

// Các shape rút gọn nhúng trong OrderDetail — xem type đầy đủ ở types/orderWarning.ts,
// services/payment.service.ts (Deposit), services/settlement.service.ts (Settlement)
export interface OrderWarningSummary {
  warningId: string;
  orderId: string;
  content: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface OrderDepositSummary {
  depositId: string;
  depositCode: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
}

export interface OrderSettlementSummary {
  settlementId: string;
  orderId: string;
  finalAmount: number;
  status: 'DRAFT' | 'AGREED' | 'REQUESTED' | 'PAID' | 'CONFIRMED';
  createdAt: string;
}

// POST /api/v1/orders — createOrderSchema thật (order.validator.ts). Không tự copy items từ
// Quotation — items là danh sách độc lập của Order, phải nhập lại thủ công dù đã chọn quotationId.
export interface CreateOrderItemPayload {
  itemId: string;
  quantity: number;
  unitPrice: number;
  source?: OrderItemSource;
  notes?: string;
}

export interface CreateOrderPayload {
  customerId: string;
  quotationId?: string;
  policyId?: string;
  eventName?: string;
  eventType: string;
  eventDate: string; // ISO datetime string
  location: string;
  guestCount?: number;
  items: CreateOrderItemPayload[]; // tối thiểu 1
  notes?: string;
}

// POST /api/v1/orders trả về — KHÔNG trả full object, chỉ 2 field.
export interface CreateOrderResult {
  orderId: string;
  orderCode: string;
}

// PUT /api/v1/orders/:id/status
export interface UpdateOrderStatusPayload {
  orderStatus: OrderStatus;
  cancelReason?: string;
  notes?: string;
}

// PUT /api/v1/orders/:id/items — thay TOÀN BỘ danh sách item (xoá hết rồi tạo lại)
export interface UpdateOrderItemsPayload {
  items: CreateOrderItemPayload[];
}
