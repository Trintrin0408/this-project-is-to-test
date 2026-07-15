import api from './api';
import type { CreateCustomerPayload, UpdateCustomerPayload } from '@/types/customer';

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const customerApiService = {
  /** GET /api/v1/customers (UC 2.9) */
  async getCustomers(params?: GetCustomersQuery) {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  /** GET /api/v1/customers/{id} (UC 2.9) */
  async getCustomer(id: string) {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  /** POST /api/v1/customers (UC 2.9) */
  async createCustomer(payload: CreateCustomerPayload) {
    const response = await api.post('/customers', payload);
    return response.data;
  },

  /** PUT /api/v1/customers/{id} (UC 2.9) */
  async updateCustomer(id: string, payload: UpdateCustomerPayload) {
    const response = await api.put(`/customers/${id}`, payload);
    return response.data;
  },
};
