import api from './api';
import type { ApiEnvelope, ApiListMeta } from './customer.service';
import type { CreateSupplierPayload, GetSuppliersQuery, Supplier, UpdateSupplierPayload } from '@/types/supplier';

export const supplierApiService = {
  /** GET /api/v1/suppliers */
  async getSuppliers(params?: GetSuppliersQuery) {
    const response = await api.get<ApiEnvelope<Supplier[], ApiListMeta>>('/suppliers', { params });
    return response.data;
  },

  /** GET /api/v1/suppliers/:id */
  async getSupplier(id: string) {
    const response = await api.get<ApiEnvelope<Supplier>>(`/suppliers/${id}`);
    return response.data;
  },

  /** POST /api/v1/suppliers */
  async createSupplier(payload: CreateSupplierPayload) {
    const response = await api.post<ApiEnvelope<Supplier>>('/suppliers', payload);
    return response.data;
  },

  /** PUT /api/v1/suppliers/:id — không có endpoint status riêng, đổi status qua PUT chung (chấp nhận body chỉ {status}) */
  async updateSupplier(id: string, payload: UpdateSupplierPayload) {
    const response = await api.put<ApiEnvelope<Supplier>>(`/suppliers/${id}`, payload);
    return response.data;
  },
};
