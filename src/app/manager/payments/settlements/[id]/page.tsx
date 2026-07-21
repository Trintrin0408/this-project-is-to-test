'use client';

import SettlementDetailView from '@/components/payments/SettlementDetailView';

// Nối API thật (2026-07-21) — xem giải thích ở đầu SettlementDetailView.tsx. Manager có đầy đủ quyền
// lập/điều chỉnh/xác nhận biên bản quyết toán.
export default function Page() {
  return <SettlementDetailView canManage backHref="/manager/payments/settlements" />;
}
