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
  QuotationAwaitingDeposit,
  getOrderPaymentViews,
  getQuotationsAwaitingDeposit,
} from '@/mocks/db';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/db/payments.ts. Tách riêng khỏi màn "Thanh
// toán" (quyết toán cuối kỳ, /manager/payments/settlements) theo yêu cầu người dùng — trước đây 2
// nội dung này gộp chung 1 bảng + 1 trang chi tiết có tab, giờ là 2 màn độc lập. Trang này chỉ còn tập
// trung vào tiền cọc; "Xem chi tiết" dẫn tới /manager/payments/deposits/[id] (chỉ hồ sơ cọc).
//
// Theo yêu cầu người dùng, bảng còn gộp thêm báo giá đã duyệt nhưng CHƯA tạo đơn đặt thật
// (getQuotationsAwaitingDeposit — luôn "Chờ thanh toán" vì chưa thể có hồ sơ cọc thật khi chưa có đơn)
// để thấy đủ bức tranh báo giá nào sắp tới cần cọc, không chỉ đơn đặt đã tồn tại. Dòng báo giá dẫn
// sang trang chi tiết BÁO GIÁ (không phải trang chi tiết đặt cọc) vì chưa có gì để xác nhận ở đây.

type DepositFilter = '' | DepositStatus;
type DepositRowKind = 'order' | 'quotation';
type KindFilter = '' | DepositRowKind;

const KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: '', label: 'Loại: Tất cả' },
  { value: 'order', label: 'Đơn đặt' },
  { value: 'quotation', label: 'Báo giá' },
];

interface DepositListRow {
  key: string;
  kind: DepositRowKind;
  code: string;
  eventTitle: string;
  customerName: string;
  customerPhone: string;
  totalValue: number;
  depositAmount: number;
  isEstimatedDeposit: boolean;
  depositStatus: DepositStatus;
  paymentMethod: string | null;
  detailHref: string;
}

function paymentMethodLabel(value: string | null): string {
  if (!value) return '-';
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function toOrderRow(o: OrderPaymentView): DepositListRow {
  return {
    key: `order-${o.orderId}`,
    kind: 'order',
    code: o.orderCode,
    eventTitle: o.eventTitle,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    totalValue: o.totalValue,
    depositAmount: o.depositAmount,
    isEstimatedDeposit: false,
    depositStatus: o.depositStatus,
    paymentMethod: o.paymentMethod,
    detailHref: `/manager/payments/deposits/${o.orderId}`,
  };
}

function toQuotationRow(q: QuotationAwaitingDeposit): DepositListRow {
  return {
    key: `quotation-${q.quotationId}`,
    kind: 'quotation',
    code: q.quotationCode,
    eventTitle: q.eventTitle,
    customerName: q.customerName,
    customerPhone: q.customerPhone,
    totalValue: q.totalValue,
    depositAmount: q.estimatedDepositAmount,
    isEstimatedDeposit: true,
    depositStatus: 'PENDING',
    paymentMethod: null,
    detailHref: `/manager/quotations/${q.quotationId}`,
  };
}

export default function Page() {
  const [payments] = useState<OrderPaymentView[]>(() => getOrderPaymentViews());
  const [quotationsAwaiting] = useState<QuotationAwaitingDeposit[]>(() => getQuotationsAwaitingDeposit());
  const [search, setSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<DepositFilter>('');
  const [methodFilter, setMethodFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('');

  const rows = useMemo<DepositListRow[]>(
    () => [...payments.map(toOrderRow), ...quotationsAwaiting.map(toQuotationRow)],
    [payments, quotationsAwaiting],
  );

  const hasActiveFilters = Boolean(search || depositFilter || methodFilter || kindFilter);

  const handleResetFilters = () => {
    setSearch('');
    setDepositFilter('');
    setMethodFilter('');
    setKindFilter('');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter && r.kind !== kindFilter) return false;
      if (depositFilter && r.depositStatus !== depositFilter) return false;
      if (methodFilter && r.paymentMethod !== methodFilter) return false;
      if (!term) return true;
      return r.code.toLowerCase().includes(term) || r.customerName.toLowerCase().includes(term);
    });
  }, [rows, search, depositFilter, methodFilter, kindFilter]);

  const columns: TableColumn<DepositListRow>[] = [
    {
      key: 'code',
      label: 'Mã đơn đặt / báo giá',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-blue-600">{r.code}</p>
            {r.kind === 'quotation' && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Báo giá</span>
            )}
          </div>
          <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400" title={r.eventTitle}>
            {r.eventTitle}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Tên khách hàng',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-800">{r.customerName}</p>
            <p className="text-xs text-slate-400">{r.customerPhone}</p>
          </div>
        </div>
      ),
    },
    { key: 'totalValue', label: 'Tổng giá trị', render: (r) => <span className="font-bold text-slate-900">{formatCurrency(r.totalValue)}</span> },
    {
      key: 'depositAmount',
      label: 'Tiền đặt cọc',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{formatCurrency(r.depositAmount)}</span>
          {r.isEstimatedDeposit && <p className="text-[10px] italic text-slate-400">Dự kiến, chưa tạo đơn</p>}
        </div>
      ),
    },
    {
      key: 'depositStatus',
      label: 'Trạng thái cọc',
      render: (r) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${DEPOSIT_STATUS_META[r.depositStatus].badgeClass}`}>
          {DEPOSIT_STATUS_META[r.depositStatus].label}
        </span>
      ),
    },
    { key: 'paymentMethod', label: 'Phương thức', render: (r) => <span className="text-slate-600">{paymentMethodLabel(r.paymentMethod)}</span> },
    {
      key: 'actions',
      label: 'Xử lý',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link
            href={r.detailHref}
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
        <h1 className="text-xl font-bold text-slate-900">Đặt cọc</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi trạng thái đặt cọc của từng đơn đặt, kèm cả báo giá đã duyệt đang chờ tạo đơn.
        </p>
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
            placeholder="Tìm mã đơn/báo giá hoặc tên khách hàng..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as KindFilter)} options={KIND_FILTER_OPTIONS} />
          <Select
            value={depositFilter}
            onChange={(e) => setDepositFilter(e.target.value as DepositFilter)}
            options={[
              { value: '', label: 'Trạng thái đặt cọc: Tất cả' },
              ...Object.entries(DEPOSIT_STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
            ]}
          />
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={[{ value: '', label: 'Phương thức: Tất cả' }, ...PAYMENT_METHOD_OPTIONS]}
          />
        </div>

        <div className="overflow-x-auto border-t border-slate-100">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.key} />
        </div>
      </Reveal>
    </div>
  );
}
