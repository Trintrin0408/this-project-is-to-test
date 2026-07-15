// UC 2.27 (docs/api/09-orders.md)

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';
export type ChangeRequestType = 'add' | 'remove' | 'replace';
export type ChangeRequestItemAction = 'add' | 'remove';

export interface ChangeRequestItem {
  catalogItemId: string;
  quantity: number;
  action: ChangeRequestItemAction;
}

// GET /api/v1/change-requests
// Pricing không trả ở đây — tính tự động khi approve và cộng vào settlement cuối (xem PUT .../approve).
export interface ChangeRequest {
  changeRequestId: string;
  orderId: string;
  type: ChangeRequestType;
  items: ChangeRequestItem[];
  status: ChangeRequestStatus;
  createdAt: string;
}

// POST /api/v1/orders/:id/change-requests
// type="replace": items phải gồm cả item bị bớt (action="remove") và item mới (action="add").
export interface CreateChangeRequestPayload {
  type: ChangeRequestType;
  items: ChangeRequestItem[];
}
