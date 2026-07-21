'use client';

import SettlementDetailView from '@/components/payments/SettlementDetailView';

// Nối API thật (2026-07-21) — xem giải thích ở đầu SettlementDetailView.tsx. Admin chỉ xem (CLAUDE.md
// mục "Vai trò & phân quyền" — Admin không xử lý vận hành hằng ngày như lập/xác nhận quyết toán).
export default function Page() {
  return <SettlementDetailView canManage={false} backHref="/admin/orders_audit/settlements" />;
}
