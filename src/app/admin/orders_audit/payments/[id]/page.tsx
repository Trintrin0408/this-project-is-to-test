'use client';

import DepositDetailView from '@/components/payments/DepositDetailView';

// Nối API thật theo docs/datcoc_api.md mục 7 — backend xác nhận chặn 403 mọi request ghi (POST/PUT)
// của role ADMIN (đã test qua curl 2026-07-21), khớp đúng CLAUDE.md mục 1 ("Admin không trực tiếp ghi
// nhận cọc"). `canManage={false}` ẩn hẳn nút tạo/xác nhận/hủy — trang Admin chỉ xem/audit.
export default function Page() {
  return <DepositDetailView canManage={false} backHref="/admin/orders_audit/payments" />;
}
