// docs/api/04-suppliers.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model Supplier), supplier.validator.ts.

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
  createdAt: string;
  updatedAt: string;
  debtBalance: number;
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
