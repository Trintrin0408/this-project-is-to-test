// docs/api/07-customers.md — ĐÃ LỖI THỜI (field tên khách hàng thật là `customerName`, không phải
// `fullName`). Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model Customer),
// customer.validator.ts, customer.service.ts.
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  customerId: string;
  customerCode: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/customers — response chỉ trả { id }
export interface CreateCustomerPayload {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
}

// PUT /api/v1/customers/:id — customerName bắt buộc (không optional), không có phone
export interface UpdateCustomerPayload {
  customerName: string;
  email?: string;
  address?: string;
}
