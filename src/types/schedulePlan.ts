// GET /api/v1/schedule-plans — thay thế Schedule/Assignment cũ. SchedulePlan là lịch + phân công
// THẬT: 1 plan = 1 order + 1 task (loại việc) + 1 người được giao (assignedTo). Muốn nhiều người
// làm cùng 1 việc/thời điểm phải tạo nhiều SchedulePlan (mỗi người 1 plan) — khái niệm "phân công
// nhiều người" (Assignment cũ) không còn tồn tại.
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model SchedulePlan), operations.route.ts,
// operations.validator.ts, operations.service.ts.

export type ScheduleStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SchedulePlan {
  planId: string;
  planCode: string;
  orderId: string;
  taskId: string;
  assignedTo: string;
  startTime: string;
  endTime?: string;
  location?: string;
  status: ScheduleStatus;
  evidenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  taskName?: string; // join thêm khi GET
  assigneeName?: string; // join thêm khi GET
}

export interface GetSchedulePlansQuery {
  page?: number;
  limit?: number;
  orderId?: string;
  assignedTo?: string;
  status?: ScheduleStatus;
  date?: string; // YYYY-MM-DD
}

// POST /api/v1/schedule-plans
export interface CreateSchedulePlanPayload {
  orderId: string;
  taskId: string;
  assignedTo: string;
  startTime: string; // ISO datetime
  endTime?: string;
  location?: string;
  notes?: string;
}

// PUT /api/v1/schedule-plans/:id — chỉ sửa được khi status khác IN_PROGRESS/COMPLETED
export interface UpdateSchedulePlanPayload {
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
}

// PATCH /api/v1/schedule-plans/:id/status
export interface UpdateSchedulePlanStatusPayload {
  status: ScheduleStatus;
  notes?: string;
  evidenceId?: string;
}
