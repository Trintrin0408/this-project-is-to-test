import api from './api';
import type { CreateOrderWarningPayload } from '@/types/orderWarning';

export const orderWarningApiService = {
  /** GET /api/v1/orders/{id}/warnings */
  async getOrderWarnings(orderId: string) {
    const response = await api.get(`/orders/${orderId}/warnings`);
    return response.data;
  },

  /** POST /api/v1/orders/{id}/warnings */
  async createOrderWarning(orderId: string, payload: CreateOrderWarningPayload) {
    const response = await api.post(`/orders/${orderId}/warnings`, payload);
    return response.data;
  },

  /** PUT /api/v1/warnings/{warningId}/resolve — không có body */
  async resolveOrderWarning(warningId: string) {
    const response = await api.put(`/warnings/${warningId}/resolve`);
    return response.data;
  },
};
