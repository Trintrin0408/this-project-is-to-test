'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import BookingFormModal from '@/components/bookings/BookingFormModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  AdminOrderRow,
  BOOKING_STATUS_META,
  BookingStatus,
  COORDINATOR_POOL,
  PAYMENT_STATUS_META,
  PaymentStatus,
  addAdminOrder,
  buildOrderItems,
  deleteAdminOrder,
  getAdminOrders,
  nextAdminOrderId,
} from '@/mocks/db/orders';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminOrdersMock.ts. Bố cục port từ
// docs/components/Orders.tsx do người dùng cung cấp (mảng KPI gọn, filter bar, bảng full-width) —
// giữ pagination ở cuối bảng theo quy tắc thiết kế mục 3 CLAUDE.md dù file mẫu không có.

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>(() => getAdminOrders());
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [payFilter, setPayFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [coordinatorFilter, setCoordinatorFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<AdminOrderRow | null>(null);

  const kpis = {
    total: orders.length,
    NEW: orders.filter((o) => o.status === 'NEW').length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    IN_PROGRESS: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (payFilter !== 'ALL' && o.paymentStatus !== payFilter) return false;
      if (coordinatorFilter !== 'ALL' && o.coordinatorName !== coordinatorFilter) return false;
      if (!term) return true;
      return (
        o.orderId.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerPhone.includes(term) ||
        o.venue.toLowerCase().includes(term)
      );
    });
  }, [orders, search, statusFilter, payFilter, coordinatorFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredOrders.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredOrders.length, limit };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('ALL');
    setPayFilter('ALL');
    setCoordinatorFilter('ALL');
  };

  const handleCreate = (values: Omit<AdminOrderRow, 'orderId' | 'checklist' | 'status' | 'paymentStatus' | 'items' | 'liveChecklist' | 'disputeLogs'>) => {
    const orderId = nextAdminOrderId();
    addAdminOrder({
      orderId,
      status: 'NEW',
      paymentStatus: 'UNPAID',
      checklist: [],
      items: buildOrderItems(orderId, values.totalPrice, values.venue, 'NEW'),
      liveChecklist: {},
      disputeLogs: [],
      ...values,
    });
    setOrders(getAdminOrders());
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingOrder) return;
    deleteAdminOrder(deletingOrder.orderId);
    setOrders((prev) => prev.filter((o) => o.orderId !== deletingOrder.orderId));
    setDeletingOrder(null);
  };

  const kpiCards: { label: string; value: number; className: string }[] = [
    { label: 'Tổng đơn', value: kpis.total, className: 'bg-white text-slate-900' },
    { label: 'Mới', value: kpis.NEW, className: 'bg-slate-50 text-slate-600' },
    { label: 'Đã xác nhận', value: kpis.CONFIRMED, className: 'bg-blue-50/50 text-blue-700' },
    { label: 'Đang chuẩn bị', value: kpis.IN_PROGRESS, className: 'bg-indigo-50/50 text-indigo-700' },
    { label: 'Hoàn thành', value: kpis.COMPLETED, className: 'bg-green-50/50 text-green-700' },
    { label: 'Đã hủy', value: kpis.CANCELLED, className: 'bg-red-50/50 text-red-700' },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn đặt hàng</h1>
          <p className="mt-1 text-sm text-slate-500">Giám sát trạng thái đơn hàng sự kiện, kiểm soát thanh toán và điều phối kho.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Khởi tạo đơn đặt hàng
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            className={`rounded-xl border border-slate-200/80 p-3.5 shadow-2xs ${kpi.className}`}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">{kpi.label}</p>
            <p className="mt-1 text-base font-black">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row"
      >
        <div className="flex w-full flex-wrap gap-2.5 md:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Mã đơn, sự kiện, khách hàng, SĐT..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {(Object.keys(BOOKING_STATUS_META) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value as PaymentStatus | 'ALL')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả thanh toán</option>
            {(Object.keys(PAYMENT_STATUS_META) as PaymentStatus[]).map((p) => (
              <option key={p} value={p}>
                {PAYMENT_STATUS_META[p].label}
              </option>
            ))}
          </select>
          <select
            value={coordinatorFilter}
            onChange={(e) => setCoordinatorFilter(e.target.value)}
            className="max-w-[160px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Mọi điều phối viên</option>
            {COORDINATOR_POOL.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          Đặt lại
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Mã đơn</th>
                <th className="px-5 py-3">Sự kiện / Khách hàng</th>
                <th className="px-5 py-3">Ngày tổ chức</th>
                <th className="px-5 py-3">Địa điểm</th>
                <th className="px-5 py-3 text-center">Khách mời</th>
                <th className="px-5 py-3 text-right">Trị giá</th>
                <th className="px-5 py-3 text-center">Thanh toán</th>
                <th className="px-5 py-3 text-center">Đơn hàng</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center italic text-slate-400">
                    Chưa có đơn đặt hàng nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                pageRows.map((o) => (
                  <tr key={o.orderId} className="text-xs transition-all hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-mono font-bold text-blue-600">
                      <Link href={`/admin/orders_audit/${o.orderId}`} className="hover:underline">
                        {o.orderId}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="max-w-[200px] truncate font-semibold text-slate-950">{o.packageType}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-400">{o.customerName}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">{formatDate(o.weddingDate)}</td>
                    <td className="max-w-[150px] truncate px-5 py-3 text-slate-600">{o.venue}</td>
                    <td className="px-5 py-3 text-center font-bold text-slate-700">{o.guestCount}</td>
                    <td className="px-5 py-3 text-right font-black text-slate-900">{formatCurrency(o.totalPrice)}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={PAYMENT_STATUS_META[o.paymentStatus].variant}>{PAYMENT_STATUS_META[o.paymentStatus].label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={BOOKING_STATUS_META[o.status].variant}>{BOOKING_STATUS_META[o.status].label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/orders_audit/${o.orderId}`}
                          aria-label="Xem chi tiết"
                          title="Xem chi tiết"
                          className="inline-flex rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingOrder(o)}
                          aria-label="Xóa đơn đặt"
                          title="Xóa đơn đặt"
                          className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <BookingFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} coordinatorOptions={COORDINATOR_POOL} onSubmit={handleCreate} />

      <Modal
        isOpen={Boolean(deletingOrder)}
        onClose={() => setDeletingOrder(null)}
        title="Xóa đơn đặt"
        subtitle={deletingOrder ? `Bạn có chắc muốn xóa đơn "${deletingOrder.orderId}"? Hành động này không thể hoàn tác.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingOrder(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa đơn đặt
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
