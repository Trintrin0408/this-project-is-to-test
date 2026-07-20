// docs/khach_hang_api.md — khớp response thật từ backend (D:\sep490-backend-api
// src/modules/sales/customer.service.ts, CustomerDTO). Dùng chung cho luồng chọn khách hàng (tạo
// đơn/task/báo giá) VÀ trang Khách hàng/Chi tiết khách hàng (/manager/customers) — cùng 1 endpoint
// /api/v1/customers, không còn 2 khái niệm tách biệt như giai đoạn mock (AdminCustomer cũ).
export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  customerId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string | null;
  notes: string | null;
  status: CustomerStatus;
  totalBookings: number;
  totalSpent: number;
}

export interface CreateCustomerPayload {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerPayload {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: CustomerStatus;
}

// GET /api/v1/customers/:customerId/summary
export interface CustomerSummary {
  customer: Customer;
  createdAt: string;
  totalValue: number;
  paidAmount: number;
  remainingDebt: number;
  paymentRate: number;
  activeOrdersCount: number;
}

export type CustomerOrderStatus = 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// GET /api/v1/customers/:customerId/orders
export interface CustomerOrderSummary {
  orderId: string;
  event: string;
  date: string;
  value: number;
  status: CustomerOrderStatus;
  coordinator: string;
}
