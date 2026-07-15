// Field ops di động (Leader/Technical Staff) — không thuộc phạm vi web nhưng cần biết để hiển thị
// đúng dữ liệu (CLAUDE.md mục 1). Nguồn: D:\bnwems-backend-api operations.route.ts (/mobile/*).
import type { SchedulePlan } from './schedulePlan';
import type { OrderItemSource } from './order';

export interface MobileOrderPickListItem {
  itemId: string;
  itemName: string;
  quantity: number;
  preparedQty: number;
  source: OrderItemSource;
}

// GET /api/v1/mobile/orders/:id
export interface MobileOrderDetails {
  orderId: string;
  orderCode: string;
  eventName?: string;
  location: string;
  items: MobileOrderPickListItem[];
}

export type MobileSchedulePlan = SchedulePlan;

// PUT /api/v1/mobile/schedule-plans/:id/status — dùng chung schema với updateSchedulePlanStatus
export interface UpdateMobileSchedulePlanStatusPayload {
  status: SchedulePlan['status'];
  notes?: string;
}

// POST /api/v1/mobile/schedule-plans/:id/handover — set status=COMPLETED, evidenceId bắt buộc
export interface HandoverSchedulePlanPayload {
  notes?: string;
  evidenceId: string;
}
