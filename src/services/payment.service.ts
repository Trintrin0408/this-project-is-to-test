import api from './api';
import type { CreateOrderDepositPayload, UpdateDepositStatusPayload } from '@/types/payment';

export const paymentApiService = {
  /** GET /api/v1/orders/{orderId}/deposits */
  async getOrderDeposits(orderId: string) {
    const response = await api.get(`/orders/${orderId}/deposits`);
    return response.data;
  },

  /** POST /api/v1/orders/{orderId}/deposits */
  async createOrderDeposit(orderId: string, payload: CreateOrderDepositPayload) {
    const response = await api.post(`/orders/${orderId}/deposits`, payload);
    return response.data;
  },

  /** PUT /api/v1/deposits/{depositId} */
  async updateDepositStatus(depositId: string, payload: UpdateDepositStatusPayload) {
    const response = await api.put(`/deposits/${depositId}`, payload);
    return response.data;
  },
};
