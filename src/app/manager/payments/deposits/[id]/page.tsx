'use client';

import DepositDetailView from '@/components/payments/DepositDetailView';

// Nối API thật theo docs/datcoc_api.md — xem giải thích chi tiết ở
// components/payments/DepositDetailView.tsx. `[id]` = orderId (giữ nguyên quy ước cũ).
export default function Page() {
  return <DepositDetailView canManage backHref="/manager/payments/deposits" />;
}
