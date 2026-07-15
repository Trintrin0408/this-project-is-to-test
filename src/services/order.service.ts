import api from './api';
import type {
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  UpdateOrderItemsPayload,
} from '@/types/order';

export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  orderStatus?: string;
  paymentStatus?: string;
  search?: string;
}

export const orderApiService = {
  /** GET /api/v1/orders */
  async getOrders(params?: GetOrdersQuery) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  /** GET /api/v1/orders/{id} — kèm orderItems/orderWarnings/deposits/settlements */
  async getOrder(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  /** POST /api/v1/orders — trả về {orderId, orderCode}, không trả full object */
  async createOrder(payload: CreateOrderPayload) {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  /** PUT /api/v1/orders/{id}/status — dùng chung cho mọi chuyển trạng thái, kể cả hủy đơn */
  async updateOrderStatus(id: string, payload: UpdateOrderStatusPayload) {
    const response = await api.put(`/orders/${id}/status`, payload);
    return response.data;
  },

  /** PUT /api/v1/orders/{id}/items — thay TOÀN BỘ danh sách item */
  async updateOrderItems(id: string, payload: UpdateOrderItemsPayload) {
    const response = await api.put(`/orders/${id}/items`, payload);
    return response.data;
  },
};
