import type { BadgeVariant } from '@/components/ui/Badge';
import type { CustomerStatus } from '@/types/customer';

// Nhãn hiển thị cho trạng thái Customer — theo enum thật của backend (API luôn trả lowercase
// 'active'/'inactive', xem docs/khach_hang_api.md mục 1 quyết định 2).
export const CUSTOMER_STATUS_META: Record<CustomerStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  inactive: { label: 'Tạm ngưng', variant: 'neutral' },
};
