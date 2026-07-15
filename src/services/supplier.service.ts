import api from './api';
import type { CreateSupplierPayload, GetSuppliersQuery, UpdateSupplierPayload } from '@/types/supplier';

export const supplierApiService = {
  /** GET /api/v1/suppliers */
  async getSuppliers(params?: GetSuppliersQuery) {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  /** POST /api/v1/suppliers */
  async createSupplier(payload: CreateSupplierPayload) {
    const response = await api.post('/suppliers', payload);
    return response.data;
  },

  /** PUT /api/v1/suppliers/:id — không có endpoint status riêng, đổi status qua PUT chung */
  async updateSupplier(id: string, payload: UpdateSupplierPayload) {
    const response = await api.put(`/suppliers/${id}`, payload);
    return response.data;
  },
};
