import api from './api';
import type { RecordSettlementPayload, ConfirmSettlementPayload } from '@/types/settlement';

export const settlementApiService = {
  /** GET /api/v1/orders/{orderId}/settlement — trả bản ghi mới nhất hoặc null */
  async getOrderSettlement(orderId: string) {
    const response = await api.get(`/orders/${orderId}/settlement`);
    return response.data;
  },

  /** POST /api/v1/orders/{orderId}/settlement */
  async recordSettlement(orderId: string, payload: RecordSettlementPayload) {
    const response = await api.post(`/orders/${orderId}/settlement`, payload);
    return response.data;
  },

  /** PUT /api/v1/settlements/{settlementId}/confirm */
  async confirmSettlement(settlementId: string, payload: ConfirmSettlementPayload) {
    const response = await api.put(`/settlements/${settlementId}/confirm`, payload);
    return response.data;
  },
};
