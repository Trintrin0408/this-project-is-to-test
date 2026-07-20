'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ban, Calendar, Eye, FileSignature, Plus, RotateCcw, Search, ShoppingBag } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import DashboardStats, { KpiCardItem } from '@/components/reports/DashboardStats';
import CreateOrderPickQuotationModal from '@/components/orders/CreateOrderPickQuotationModal';
import CreateOrderFromQuotationModal from '@/components/quotations/CreateOrderFromQuotationModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  AdminOrderRow,
  BOOKING_STATUS_META,
  BookingStatus,
  PAYMENT_STATUS_META,
  PaymentStatus,
  getAdminOrders,
  updateAdminOrder,
} from '@/mocks/db/orders';
import { AdminQuotationRow, getAdminQuotationById } from '@/mocks/db/quotations';

// Trang thuần giao diện — theo Hướng A đã chốt ở docs/danhsachhopdong_api.md mục 1.5: khái niệm "Hợp
// đồng" không có bảng thật nào trong DB và xung đột trực tiếp với luồng Order đã có sẵn
// (CreateOrderFromQuotationModal ở trang chi tiết báo giá), nên màn này không còn là 1 entity Contract
// riêng (đã bỏ mocks/adminContractsMock.ts + ContractCreateModal.tsx khỏi luồng chính) — giờ là 1 VIEW
// LỌC của Order: chỉ hiển thị đơn đặt có `quotationId` (tức được sinh từ 1 báo giá đã duyệt), dùng
// nguyên `db/orders.ts` làm nguồn dữ liệu duy nhất, không tự sinh lại thông tin khách hàng/sự kiện lần
// thứ 2 như bản Contract cũ. Route/tên trang giữ nguyên `/admin/contracts` (theo điều hướng Sidebar hiện
// có) — chỉ đổi lại phần nội dung/dữ liệu bên trong theo đúng thực thể thật.

const STATUS_TABS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'NEW', label: BOOKING_STATUS_META.NEW.label },
  { value: 'CONFIRMED', label: BOOKING_STATUS_META.CONFIRMED.label },
  { value: 'IN_PROGRESS', label: BOOKING_STATUS_META.IN_PROGRESS.label },
  { value: 'COMPLETED', label: BOOKING_STATUS_META.COMPLETED.label },
  { value: 'CANCELLED', label: BOOKING_STATUS_META.CANCELLED.label },
];

const PAYMENT_STATUS_FILTER_OPTIONS: { value: PaymentStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'Tất cả thanh toán' },
  { value: 'UNPAID', label: PAYMENT_STATUS_META.UNPAID.label },
  { value: 'DEPOSITED', label: PAYMENT_STATUS_META.DEPOSITED.label },
  { value: 'PAID', label: PAYMENT_STATUS_META.PAID.label },
];

export default function AdminContractsPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>(() => getAdminOrders());
  const ordersFromQuotation = useMemo(() => orders.filter((o) => Boolean(o.quotationId)), [orders]);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusTab, setStatusTab] = useState<BookingStatus | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isPickQuotationOpen, setIsPickQuotationOpen] = useState(false);
  const [pickedQuotation, setPickedQuotation] = useState<AdminQuotationRow | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<AdminOrderRow | null>(null);

  const refreshOrders = useCallback(() => setOrders(getAdminOrders()), []);

  const tabCounts: Record<BookingStatus | 'all', number> = {
    all: ordersFromQuotation.length,
    NEW: ordersFromQuotation.filter((o) => o.status === 'NEW').length,
    CONFIRMED: ordersFromQuotation.filter((o) => o.status === 'CONFIRMED').length,
    IN_PROGRESS: ordersFromQuotation.filter((o) => o.status === 'IN_PROGRESS').length,
    COMPLETED: ordersFromQuotation.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: ordersFromQuotation.filter((o) => o.status === 'CANCELLED').length,
  };

  const kpis = useMemo(() => {
    const active = ordersFromQuotation.filter((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length;
    const completed = ordersFromQuotation.filter((o) => o.status === 'COMPLETED').length;
    const totalValue = ordersFromQuotation.reduce((sum, o) => sum + o.totalPrice, 0);
    return { active, completed, totalValue };
  }, [ordersFromQuotation]);

  const kpiItems: KpiCardItem[] = [
    { label: 'Tổng số đơn từ báo giá', value: ordersFromQuotation.length, icon: FileSignature, iconColor: 'blue' },
    { label: 'Đang triển khai', value: kpis.active, icon: ShoppingBag, iconColor: 'amber' },
    { label: 'Đã hoàn thành', value: kpis.completed, icon: FileSignature, iconColor: 'green' },
    { label: 'Tổng giá trị', value: formatCurrency(kpis.totalValue), icon: FileSignature, iconColor: 'pink' },
  ];

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ordersFromQuotation.filter((o) => {
      if (statusTab !== 'all' && o.status !== statusTab) return false;
      if (paymentStatusFilter !== 'All' && o.paymentStatus !== paymentStatusFilter) return false;
      if (startDate && o.weddingDate < startDate) return false;
      if (endDate && o.weddingDate > endDate) return false;
      if (!term) return true;
      return (
        o.orderId.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.venue.toLowerCase().includes(term) ||
        o.coordinatorName.toLowerCase().includes(term)
      );
    });
  }, [ordersFromQuotation, search, statusTab, paymentStatusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredOrders.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredOrders.length, limit };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusTab('all');
    setPaymentStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const handleQuotationPicked = (quotation: AdminQuotationRow) => {
    setIsPickQuotationOpen(false);
    setPickedQuotation(quotation);
  };

  const handleOrderSaved = () => {
    setPickedQuotation(null);
    refreshOrders();
  };

  const handleCancelConfirm = () => {
    if (!cancellingOrder) return;
    updateAdminOrder(cancellingOrder.orderId, { status: 'CANCELLED' });
    refreshOrders();
    setCancellingOrder(null);
  };

  const columns: TableColumn<AdminOrderRow>[] = [
    {
      key: 'orderId',
      label: 'Mã đơn',
      render: (row) => (
        <Link href={`/admin/orders_audit/${row.orderId}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
          {row.orderId}
        </Link>
      ),
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.customerName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{row.customerName}</p>
            <p className="text-xs text-slate-400">{row.customerPhone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'packageType',
      label: 'Gói & Ngày tổ chức',
      className: 'max-w-[180px]',
      render: (row) => (
        <div>
          <p className="line-clamp-1 font-medium text-slate-700">{row.packageType}</p>
          <p className="text-xs text-slate-400">{formatDate(row.weddingDate)}</p>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      label: 'Giá trị',
      className: 'text-right font-bold text-slate-900',
      render: (row) => formatCurrency(row.totalPrice),
    },
    {
      key: 'quotationId',
      label: 'Báo giá gốc',
      render: (row) => {
        const quotation = row.quotationId ? getAdminQuotationById(row.quotationId) : undefined;
        return quotation ? (
          <Link href={`/admin/quotations/${quotation.quotationId}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
            {quotation.code}
          </Link>
        ) : (
          <span className="text-xs italic text-slate-300">—</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái đơn',
      className: 'text-center',
      render: (row) => <Badge variant={BOOKING_STATUS_META[row.status].variant}>{BOOKING_STATUS_META[row.status].label}</Badge>,
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      className: 'text-center',
      render: (row) => <Badge variant={PAYMENT_STATUS_META[row.paymentStatus].variant}>{PAYMENT_STATUS_META[row.paymentStatus].label}</Badge>,
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/orders_audit/${row.orderId}`}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setCancellingOrder(row)}
              aria-label="Hủy đơn"
              title="Hủy đơn"
              className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hợp đồng</h1>
          <p className="mt-1 text-sm text-slate-500">Danh sách đơn đặt hàng được tạo từ báo giá đã duyệt và dùng để vận hành sự kiện.</p>
        </div>
        <Button onClick={() => setIsPickQuotationOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo đơn từ báo giá
        </Button>
      </div>

      <div className="mt-6">
        <DashboardStats items={kpiItems} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusTab === tab.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tabCounts[tab.value]})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã đơn, khách hàng, sảnh..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-sm hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thanh toán:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus | 'All')}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-2.5 pr-8 text-xs hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Ngày tổ chức từ"
                className="w-28 border-none bg-transparent py-0.5 text-xs text-slate-700 focus:outline-none"
              />
              <span className="text-xs text-slate-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Ngày tổ chức đến"
                className="w-28 border-none bg-transparent py-0.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition duration-150 hover:bg-slate-200"
              title="Đặt lại các bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={pageRows} rowKey={(row) => row.orderId} />
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <CreateOrderPickQuotationModal
        isOpen={isPickQuotationOpen}
        onClose={() => setIsPickQuotationOpen(false)}
        onPicked={handleQuotationPicked}
      />

      {pickedQuotation && (
        <CreateOrderFromQuotationModal
          isOpen={Boolean(pickedQuotation)}
          onClose={() => setPickedQuotation(null)}
          quotation={pickedQuotation}
          onSaved={handleOrderSaved}
        />
      )}

      <Modal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => setCancellingOrder(null)}
        title="Hủy đơn đặt"
        subtitle={cancellingOrder ? `Bạn có chắc muốn hủy đơn "${cancellingOrder.orderId}"? Đơn sẽ chuyển sang trạng thái Đã hủy, dữ liệu vẫn được giữ lại để đối chiếu.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancellingOrder(null)}>
              Đóng
            </Button>
            <Button variant="danger" onClick={handleCancelConfirm}>
              Hủy đơn
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
