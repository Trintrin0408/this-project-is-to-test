import api from './api';
import type {
  CreateCustomerPayload,
  Customer,
  CustomerOrderStatus,
  CustomerOrderSummary,
  CustomerStatus,
  CustomerSummary,
  UpdateCustomerPayload,
} from '@/types/customer';

export interface ApiListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiEnvelope<T, M = undefined> {
  success: boolean;
  data: T;
  meta?: M;
}

export interface GetCustomersQuery {
  status?: CustomerStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerListMeta extends ApiListMeta {
  counts: { all: number; active: number; inactive: number };
}

export interface GetCustomerOrdersQuery {
  search?: string;
  status?: CustomerOrderStatus;
  serviceFilter?: string;
  page?: number;
  limit?: number;
}

export const customerApiService = {
  /** GET /api/v1/customers (UC 2.9, docs/khach_hang_api.md mục 2.1) */
  async getCustomers(params?: GetCustomersQuery) {
    const response = await api.get<ApiEnvelope<Customer[], CustomerListMeta>>('/customers', { params });
    return response.data;
  },

  /** GET /api/v1/customers/{id} (UC 2.9, mục 2.3) */
  async getCustomer(id: string) {
    const response = await api.get<ApiEnvelope<Customer>>(`/customers/${id}`);
    return response.data;
  },

  /** POST /api/v1/customers (UC 2.9, mục 2.2) */
  async createCustomer(payload: CreateCustomerPayload) {
    const response = await api.post<ApiEnvelope<Customer>>('/customers', payload);
    return response.data;
  },

  /** PUT /api/v1/customers/{id} (UC 2.9, mục 2.4) */
  async updateCustomer(id: string, payload: UpdateCustomerPayload) {
    const response = await api.put<ApiEnvelope<Customer>>(`/customers/${id}`, payload);
    return response.data;
  },

  /** DELETE /api/v1/customers/{id} — 409 nếu khách hàng đã có Order (mục 2.5) */
  async deleteCustomer(id: string) {
    const response = await api.delete<ApiEnvelope<{ customerId: string }>>(`/customers/${id}`);
    return response.data;
  },

  /** GET /api/v1/customers/{id}/summary — tổng quan giao dịch + công nợ (mục 2.6) */
  async getCustomerSummary(id: string) {
    const response = await api.get<ApiEnvelope<CustomerSummary>>(`/customers/${id}/summary`);
    return response.data;
  },

  /** GET /api/v1/customers/{id}/orders — danh sách đơn hàng của khách hàng (mục 2.7) */
  async getCustomerOrders(id: string, params?: GetCustomerOrdersQuery) {
    const response = await api.get<ApiEnvelope<CustomerOrderSummary[], ApiListMeta>>(`/customers/${id}/orders`, { params });
    return response.data;
  },
};
