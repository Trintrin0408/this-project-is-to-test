import type { SettlementStatus } from '@/types/settlement';
import type { BadgeVariant } from '@/components/ui/Badge';

// Nhãn hiển thị cho Settlement.status thật (5 giá trị) — chỉ 2 giá trị DRAFT/CONFIRMED thực sự được
// FE tạo ra qua luồng hiện có (POST .../settlement luôn tạo DRAFT, PUT .../confirm chuyển CONFIRMED,
// xem RecordSettlementModal.tsx) — 3 giá trị còn lại (AGREED/REQUESTED/PAID) khai đủ theo enum thật
// nhưng chưa có luồng UI nào set tới, giữ nhãn dự phòng nếu backend tự chuyển trạng thái.
export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  DRAFT: 'Bản nháp',
  AGREED: 'Đã thống nhất',
  REQUESTED: 'Đã yêu cầu thanh toán',
  PAID: 'Đã thanh toán',
  CONFIRMED: 'Đã xác nhận quyết toán',
};

export const SETTLEMENT_STATUS_VARIANT: Record<SettlementStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  AGREED: 'info',
  REQUESTED: 'warning',
  PAID: 'warning',
  CONFIRMED: 'success',
};
