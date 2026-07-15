import api from './api';
import type { GetSchedulePlansQuery } from '@/types/schedulePlan';
import type { HandoverSchedulePlanPayload, UpdateMobileSchedulePlanStatusPayload } from '@/types/fieldOps';
import type { CreateCollectedEquipmentReportPayload } from '@/types/collectedEquipmentReport';

// Không thuộc phạm vi web (Leader/Technical Staff dùng mobile) — giữ lại để tham khảo/hiển thị dữ
// liệu hiện trường đúng khi cần (CLAUDE.md mục 1).
export const fieldOpsApiService = {
  /** GET /api/v1/mobile/schedule-plans — chỉ trả plan của chính user hiện tại */
  async getMobileSchedulePlans(params?: Pick<GetSchedulePlansQuery, 'status' | 'date'>) {
    const response = await api.get('/mobile/schedule-plans', { params });
    return response.data;
  },

  /** PUT /api/v1/mobile/schedule-plans/:id/status */
  async updateMobileSchedulePlanStatus(planId: string, payload: UpdateMobileSchedulePlanStatusPayload) {
    const response = await api.put(`/mobile/schedule-plans/${planId}/status`, payload);
    return response.data;
  },

  /** GET /api/v1/mobile/orders/:id — pick-list thiết bị */
  async getMobileOrderDetails(orderId: string) {
    const response = await api.get(`/mobile/orders/${orderId}`);
    return response.data;
  },

  /** POST /api/v1/mobile/schedule-plans/:id/handover — set status=COMPLETED */
  async handoverSchedulePlan(planId: string, payload: HandoverSchedulePlanPayload) {
    const response = await api.post(`/mobile/schedule-plans/${planId}/handover`, payload);
    return response.data;
  },

  /** POST /api/v1/mobile/orders/:id/collected-reports */
  async createCollectedEquipmentReport(orderId: string, payload: CreateCollectedEquipmentReportPayload) {
    const response = await api.post(`/mobile/orders/${orderId}/collected-reports`, payload);
    return response.data;
  },
};
