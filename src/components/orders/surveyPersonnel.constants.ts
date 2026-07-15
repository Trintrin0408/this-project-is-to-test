import { Wrench, ClipboardList, type LucideIcon } from 'lucide-react';
import type { ScheduleStatus } from '@/types/schedulePlan';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

// Trạng thái SchedulePlan — thay thế cả WorkTask.status lẫn FieldStatus cũ (khái niệm phân công
// nhiều người theo field-status riêng không còn tồn tại — mỗi người = 1 SchedulePlan, trạng thái
// hiện trường chính là SchedulePlan.status). Xem docs/more-require.md.
export const SCHEDULE_STATUS_META: Record<ScheduleStatus, { label: string; variant: BadgeVariant }> = {
  COMPLETED: { label: 'ĐÃ HOÀN THÀNH', variant: 'success' },
  IN_PROGRESS: { label: 'ĐANG THỰC HIỆN', variant: 'info' },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', variant: 'warning' },
  PENDING: { label: 'CHỜ XỬ LÝ', variant: 'neutral' },
  CANCELLED: { label: 'ĐÃ HỦY', variant: 'error' },
};

// WorkTask giờ chỉ là danh mục tĩnh (taskCode/taskName), không còn taskCategory 'survey'/'operation'
// — phân biệt khảo sát/thi công dựa theo taskName chứa từ khoá "khảo sát" hay không.
export function taskNameIcon(taskName: string): LucideIcon {
  return taskName.toLowerCase().includes('khảo sát') ? ClipboardList : Wrench;
}

// Vai trò gợi ý cho modal "+ Phân công" (thi công)
export const EXECUTION_ROLE_OPTIONS = ['Trưởng nhóm', 'Kỹ thuật âm thanh', 'Kỹ thuật ánh sáng', 'Kỹ thuật chung'];

export const SURVEY_ROLE = 'Khảo sát viên';
