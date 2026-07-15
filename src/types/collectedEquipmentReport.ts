// Thay thế DamageLossItem cũ (đã bị xoá khỏi schema) — field khác hẳn, KHÔNG có
// responsibleParty/compensationAmount per-item. Bồi thường (nếu có) nay xử lý thủ công qua field
// `compensation` chung của Settlement (types/settlement.ts), không gắn per-item/per-người.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model CollectedEquipmentReport/Item),
// inventory.route.ts (/inventory/return-reports), operations.route.ts (/mobile/orders/:id/collected-reports).

export type CollectedEquipmentReportType = 'INTERNAL' | 'SUPPLIER';
export type CollectedEquipmentReportStatus = 'SUBMITTED' | 'CONFIRMED';

export interface CollectedEquipmentReportItem {
  cerItemId?: string;
  itemId: string;
  goodQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  notes?: string;
}

export interface CollectedEquipmentReport {
  reportId: string;
  orderId: string;
  reportType: CollectedEquipmentReportType;
  transactionId?: string;
  status: CollectedEquipmentReportStatus;
  reportedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  notes?: string;
  items: CollectedEquipmentReportItem[];
  createdAt: string;
}

// POST /api/v1/inventory/return-reports (kho xác nhận nhập lại)
// POST /api/v1/mobile/orders/:id/collected-reports (field ops di động ghi nhận)
export interface CreateCollectedEquipmentReportPayload {
  orderId: string;
  reportType: CollectedEquipmentReportType;
  notes?: string;
  items: { itemId: string; goodQuantity: number; damagedQuantity: number; lostQuantity: number }[];
}
