// docs/api/05-warehouse-inventory.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06. Không còn
// khái niệm nhiều kho (warehouseId) — Inventory giờ khoá 1-1 theo itemId duy nhất.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model Inventory/InventoryMovement),
// inventory.route.ts, inventory.validator.ts, inventory.service.ts.

// GET /api/v1/inventory
export interface InventoryRow {
  inventoryId: string;
  itemId: string;
  quantityTotal: number;
  quantityDamaged: number;
  quantityReserved: number;
  quantityAvailable: number;
  itemName?: string; // join thêm khi GET
  updatedAt: string;
}

export interface GetInventoryQuery {
  itemId?: string;
  page?: number;
  limit?: number;
}

// POST /api/v1/inventory/adjust — quantityChange có thể âm/dương
export interface AdjustInventoryPayload {
  itemId: string;
  quantityChange: number;
  notes?: string;
}

export type MovementType = 'OUTBOUND' | 'INBOUND' | 'ADJUSTMENT';

// GET /api/v1/inventory/movements
export interface InventoryMovement {
  movementId: string;
  itemId: string;
  orderId?: string;
  reportId?: string;
  movementType: MovementType;
  quantity: number;
  performedBy: string;
  notes?: string;
  itemName?: string;
  performedByName?: string;
  createdAt: string;
}

export interface GetInventoryMovementsQuery {
  itemId?: string;
  movementType?: MovementType;
  page?: number;
  limit?: number;
}
