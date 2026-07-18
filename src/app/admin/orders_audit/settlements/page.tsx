'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, RotateCcw, Search, User } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Reveal from '@/components/ui/Reveal';
import { formatCurrency } from '@/utils/formatCurrency';
import { OrderPaymentView, SETTLEMENT_STATUS_META, SettlementStatus, computeOrderFinancials, getOrderPaymentViews } from '@/mocks/db';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/db/payments.ts. Tách riêng khỏi màn "Đặt
// cọc" (/admin/orders_audit/payments) theo yêu cầu người dùng — trước đây 2 nội dung này gộp chung 1
// bảng + 1 trang chi tiết có tab, giờ là 2 màn độc lập. Trang này chỉ tập trung vào quyết toán cuối
// kỳ; "Xem chi tiết" dẫn tới /admin/orders_audit/settlements/[id] (chỉ hồ sơ quyết toán).

type SettlementFilter = '' | SettlementStatus;

export default function Page() {
  const [payments] = useState<OrderPaymentView[]>(() => getOrderPaymentViews());
  const [search, setSearch] = useState('');
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('');

  const hasActiveFilters = Boolean(search || settlementFilter);

  const handleResetFilters = () => {
    setSearch('');
    setSettlementFilter('');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((o) => {
      if (settlementFilter && o.settlementStatus !== settlementFilter) return false;
      if (!term) return true;
      return o.orderCode.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term);
    });
  }, [payments, search, settlementFilter]);

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
      key: 'remaining',
      label: 'Số tiền còn lại',
      render: (o) => {
        const { remainingAmount } = computeOrderFinancials(o);
        return <span className={`font-bold ${remainingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{formatCurrency(remainingAmount)}</span>;
      },
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
    {
      key: 'actions',
      label: 'Xử lý',
      render: (o) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/orders_audit/settlements/${o.orderId}`}
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
        <h1 className="text-xl font-bold text-slate-900">Thanh toán</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái quyết toán cuối kỳ của từng đơn đặt.</p>
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

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Input
            placeholder="Tìm mã đơn hoặc tên khách hàng..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value as SettlementFilter)}
            options={[
              { value: '', label: 'Trạng thái quyết toán: Tất cả' },
              ...Object.entries(SETTLEMENT_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
            ]}
          />
        </div>

        <div className="overflow-x-auto border-t border-slate-100">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.orderId} />
        </div>
      </Reveal>
    </div>
  );
}
