// SchedulePlan.status — thay thế WorkTask.taskCategory/status cũ (WorkTask giờ chỉ là danh mục
// tĩnh loại việc, không còn trạng thái theo instance). Xem types/schedulePlan.ts.
export const SCHEDULE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
