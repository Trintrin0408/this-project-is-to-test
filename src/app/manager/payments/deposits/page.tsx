'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, RotateCcw, Search, User } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Reveal from '@/components/ui/Reveal';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  DEPOSIT_STATUS_META,
  DepositStatus,
  OrderPaymentView,
  PAYMENT_METHOD_OPTIONS,
  SETTLEMENT_STATUS_META,
  SettlementStatus,
  getOrderPaymentViews,
} from '@/mocks/db';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/db/payments.ts. Khớp ảnh mẫu
// "Đặt cọc & Thanh toán": panel "Bộ lọc & tìm kiếm" (tìm kiếm + 3 dropdown trạng thái/phương thức +
// đặt lại bộ lọc) và bảng đơn đặt kèm trạng thái cọc/quyết toán độc lập. "Xem chi tiết" dẫn tới trang
// /manager/payments/deposits/[id] (hồ sơ cọc + quyết toán đầy đủ).

type DepositFilter = '' | DepositStatus;
type SettlementFilter = '' | SettlementStatus;

function paymentMethodLabel(value: string | null): string {
  if (!value) return '-';
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function Page() {
  const [payments] = useState<OrderPaymentView[]>(() => getOrderPaymentViews());
  const [search, setSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<DepositFilter>('');
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('');
  const [methodFilter, setMethodFilter] = useState('');

  const hasActiveFilters = Boolean(search || depositFilter || settlementFilter || methodFilter);

  const handleResetFilters = () => {
    setSearch('');
    setDepositFilter('');
    setSettlementFilter('');
    setMethodFilter('');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((o) => {
      if (depositFilter && o.depositStatus !== depositFilter) return false;
      if (settlementFilter && o.settlementStatus !== settlementFilter) return false;
      if (methodFilter && o.paymentMethod !== methodFilter) return false;
      if (!term) return true;
      return o.orderCode.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term);
    });
  }, [payments, search, depositFilter, settlementFilter, methodFilter]);

  const columns: TableColumn<OrderPaymentView>[] = [
    {
      key: 'orderCode',
      label: 'Mã đơn đặt',
      render: (o) => (
        <div>
          <p className="font-bold text-blue-600">{o.orderCode}</p>
          <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400" title={o.eventTitle}>
            {o.eventTitle}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Tên khách hàng',
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-800">{o.customerName}</p>
            <p className="text-xs text-slate-400">{o.customerPhone}</p>
          </div>
        </div>
      ),
    },
    { key: 'totalValue', label: 'Tổng giá trị đơn', render: (o) => <span className="font-bold text-slate-900">{formatCurrency(o.totalValue)}</span> },
    {
      key: 'depositAmount',
      label: 'Tiền đặt cọc',
      render: (o) => (
        <div>
          <p className="font-bold text-slate-900">{formatCurrency(o.depositAmount)}</p>
          {o.depositIsEstimated && <p className="text-xs font-medium text-amber-600">{o.depositEstimatedLabel}</p>}
        </div>
      ),
    },
    {
      key: 'depositStatus',
      label: 'Trạng thái cọc',
      render: (o) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${DEPOSIT_STATUS_META[o.depositStatus].badgeClass}`}>
          {DEPOSIT_STATUS_META[o.depositStatus].label}
        </span>
      ),
    },
    {
      key: 'settlementStatus',
      label: 'Trạng thái quyết toán',
      render: (o) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${SETTLEMENT_STATUS_META[o.settlementStatus].badgeClass}`}>
          {SETTLEMENT_STATUS_META[o.settlementStatus].label}
        </span>
      ),
    },
    { key: 'paymentMethod', label: 'Phương thức', render: (o) => <span className="text-slate-600">{paymentMethodLabel(o.paymentMethod)}</span> },
    {
      key: 'actions',
      label: 'Xử lý',
      render: (o) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/manager/payments/deposits/${o.orderId}`}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Đặt cọc &amp; Thanh toán</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái đặt cọc và quyết toán cuối của từng đơn đặt.</p>
      </div>

      <Reveal className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bộ lọc &amp; tìm kiếm</p>
          {hasActiveFilters && (
            <button type="button" onClick={handleResetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Tìm mã đơn hoặc tên khách hàng..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={depositFilter}
            onChange={(e) => setDepositFilter(e.target.value as DepositFilter)}
            options={[
              { value: '', label: 'Trạng thái đặt cọc: Tất cả' },
              ...Object.entries(DEPOSIT_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
            ]}
          />
          <Select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value as SettlementFilter)}
            options={[
              { value: '', label: 'Trạng thái quyết toán: Tất cả' },
              ...Object.entries(SETTLEMENT_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
            ]}
          />
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={[{ value: '', label: 'Phương thức: Tất cả' }, ...PAYMENT_METHOD_OPTIONS]}
          />
        </div>

        <div className="overflow-x-auto border-t border-slate-100">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.orderId} />
        </div>
      </Reveal>
    </div>
  );
}
