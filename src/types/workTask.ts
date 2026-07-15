// docs/api/10-survey-assignment.md — ĐÃ LỖI THỜI sau đợt backend refactor 2026-07-06. WorkTask giờ
// là DANH MỤC TĨNH (loại công việc, vd "Khảo sát", "Lắp đặt", "Thu hồi") — không còn orderId,
// scheduleId, taskCategory, progressPercent, status trên chính WorkTask. Lịch + phân công thật nằm
// ở SchedulePlan (xem types/schedulePlan.ts). Không có route tạo/sửa WorkTask ở FE (chỉ GET).
// Nguồn: D:\bnwems-backend-api prisma/schema.prisma (model WorkTask), operations.route.ts.

export interface WorkTask {
  taskId: string;
  taskCode: string;
  taskName: string;
  description?: string;
  isActive: boolean;
}

export interface GetWorkTasksQuery {
  isActive?: boolean;
}
