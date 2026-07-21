// Xác nhận trực tiếp qua curl với backend thật (localhost:3001) ngày 2026-07-21 — GET/POST/PUT
// /api/v1/suppliers đã hoạt động (trước đó 404, xem docs/supplier_api.md mục 6.0). `debtBalance` được
// backend tính sẵn (denormalized) và trả kèm trong mọi response Supplier — không cần FE tự tính lại từ
// supplier-transactions. `email` gửi lên bị bỏ qua âm thầm (không lưu, không trả về).

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  serviceType: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  notes?: string;
  status: SupplierStatus;
  /** Tổng dư nợ hiện tại — backend tính sẵn (denormalized) từ supplier_transactions, trả kèm mọi
   * response Supplier. Không tự tính lại ở FE (xem comment đầu file). */
  debtBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  supplierCode: string;
  supplierName: string;
  serviceType: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  rating?: number;
}

export interface UpdateSupplierPayload {
  supplierName?: string;
  serviceType?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  rating?: number;
  status?: SupplierStatus;
}

export interface GetSuppliersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplierStatus;
}
