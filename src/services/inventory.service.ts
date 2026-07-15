import api from './api';
import type { AdjustInventoryPayload, GetInventoryMovementsQuery, GetInventoryQuery } from '@/types/inventory';
import type { CreateCollectedEquipmentReportPayload } from '@/types/collectedEquipmentReport';

export const inventoryApiService = {
  /** GET /api/v1/inventory */
  async getInventory(params?: GetInventoryQuery) {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  /** POST /api/v1/inventory/adjust */
  async adjustInventory(payload: AdjustInventoryPayload) {
    const response = await api.post('/inventory/adjust', payload);
    return response.data;
  },

  /** GET /api/v1/inventory/movements */
  async getMovements(params?: GetInventoryMovementsQuery) {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  /** POST /api/v1/inventory/return-reports — kho ghi nhận báo cáo thu hồi thiết bị */
  async createReturnReport(payload: CreateCollectedEquipmentReportPayload) {
    const response = await api.post('/inventory/return-reports', payload);
    return response.data;
  },

  /** PUT /api/v1/inventory/return-reports/:id/confirm — cộng good vào available, damaged vào damaged, trừ lost khỏi total */
  async confirmReturnReport(reportId: string) {
    const response = await api.put(`/inventory/return-reports/${reportId}/confirm`);
    return response.data;
  },
};
