import type { BadgeVariant } from '@/components/ui/Badge';

export type EventUrgency = 'urgent' | 'soon' | 'none';

/** Số ngày từ referenceDate đến dateStr (dương = tương lai, âm = đã qua). Cả 2 tham số dạng
 * YYYY-MM-DD. Dùng cho cảnh báo sự kiện sắp diễn ra (chuông thông báo, trang Kế hoạch, chi tiết đơn) —
 * KHÔNG dùng `new Date()` thật, referenceDate luôn truyền vào là REFERENCE_TODAY (mock "hôm nay"). */
export function daysUntil(dateStr: string, referenceDate: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((new Date(dateStr).getTime() - new Date(referenceDate).getTime()) / MS_PER_DAY);
}

/** Phân loại mức khẩn cấp: ≤3 ngày = khẩn cấp, 4-7 ngày = sắp tới, còn lại (đã qua hoặc >7 ngày) = none. */
export function getEventUrgency(daysLeft: number): EventUrgency {
  if (daysLeft < 0) return 'none';
  if (daysLeft <= 3) return 'urgent';
  if (daysLeft <= 7) return 'soon';
  return 'none';
}

/** Biến thể Badge tương ứng — null nghĩa là không nên hiển thị badge cảnh báo (đã qua/quá xa). */
export function getUrgencyBadgeVariant(daysLeft: number): BadgeVariant | null {
  const urgency = getEventUrgency(daysLeft);
  if (urgency === 'urgent') return 'error';
  if (urgency === 'soon') return 'warning';
  return null;
}
