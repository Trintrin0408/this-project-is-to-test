'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Eye, FilePen, FileSignature, Plus, RotateCcw, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import DashboardStats, { KpiCardItem } from '@/components/reports/DashboardStats';
import ContractCreateModal from '@/components/contracts/ContractCreateModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  AdminContract,
  CONTRACT_STATUS_META,
  ContractStatus,
  createContractFromQuotation,
  deleteAdminContract,
  getAdminContracts,
} from '@/mocks/adminContractsMock';
import { AdminOrderRow, BOOKING_STATUS_META, PAYMENT_STATUS_META, getAdminOrders } from '@/mocks/db/orders';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminContractsMock.ts. Thanh bộ lọc (dropdown
// trạng thái đơn liên kết, trạng thái thanh toán, khoảng ngày tạo, nút "Làm mới") và các cột "Đơn đặt
// liên kết"/"Trạng thái Đơn"/"Thanh toán" trong bảng port cách trình bày từ docs/components/Contracts.tsx
// do người dùng cung cấp (giữ accent xanh blue + component dùng chung của site thay vì indigo gốc).
// Vẫn giữ nguyên tabs trạng thái hợp đồng (draft/sent/signed/completed) vốn có vì đó là vòng đời riêng
// của hợp đồng — khác với trạng thái đơn đặt hàng liên kết mà bản tham chiếu dùng làm tab chính.

const STATUS_TABS: { value: ContractStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'draft', label: 'Nháp' },
  { value: 'sent', label: 'Đã gửi' },
  { value: 'signed', label: 'Đã ký' },
  { value: 'completed', label: 'Đã thanh lý' },
];

const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'Tất cả trạng thái đơn' },
  { value: 'NotCreated', label: 'Chưa tạo đơn đặt' },
  { value: 'NEW', label: `Đơn mới (${BOOKING_STATUS_META.NEW.label})` },
  { value: 'CONFIRMED', label: `Xác nhận (${BOOKING_STATUS_META.CONFIRMED.label})` },
  { value: 'IN_PROGRESS', label: `Đang làm (${BOOKING_STATUS_META.IN_PROGRESS.label})` },
  { value: 'COMPLETED', label: `Hoàn thành (${BOOKING_STATUS_META.COMPLETED.label})` },
  { value: 'CANCELLED', label: `Đã hủy (${BOOKING_STATUS_META.CANCELLED.label})` },
];

const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'Tất cả thanh toán' },
  { value: 'None', label: 'Chưa có đơn hàng' },
  { value: 'UNPAID', label: PAYMENT_STATUS_META.UNPAID.label },
  { value: 'DEPOSITED', label: PAYMENT_STATUS_META.DEPOSITED.label },
  { value: 'PAID', label: PAYMENT_STATUS_META.PAID.label },
];

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<AdminContract[]>(() => getAdminContracts());
  const orders = useMemo(() => getAdminOrders(), []);
  const findLinkedOrder = useCallback(
    (contract: AdminContract): AdminOrderRow | undefined => orders.find((o) => o.quotationId === contract.quotationId),
    [orders],
  );

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusTab, setStatusTab] = useState<ContractStatus | 'all'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState<AdminContract | null>(null);

  const tabCounts: Record<ContractStatus | 'all', number> = {
    all: contracts.length,
    draft: contracts.filter((c) => c.status === 'draft').length,
    sent: contracts.filter((c) => c.status === 'sent').length,
    signed: contracts.filter((c) => c.status === 'signed').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
  };

  const kpis = useMemo(() => {
    let withOrder = 0;
    let withoutOrder = 0;
    let totalValue = 0;
    contracts.forEach((c) => {
      const linkedOrder = findLinkedOrder(c);
      totalValue += c.grandTotal;
      if (!linkedOrder) withoutOrder += 1;
      else if (linkedOrder.status !== 'CANCELLED') withOrder += 1;
    });
    return { withOrder, withoutOrder, totalValue };
  }, [contracts, findLinkedOrder]);

  const kpiItems: KpiCardItem[] = [
    { label: 'Tổng số hợp đồng', value: contracts.length, icon: FileSignature, iconColor: 'blue' },
    { label: 'Đã thành đơn đặt', value: kpis.withOrder, icon: ShoppingBag, iconColor: 'green' },
    { label: 'Chưa tạo đơn', value: kpis.withoutOrder, icon: FilePen, iconColor: 'amber' },
    { label: 'Tổng giá trị', value: formatCurrency(kpis.totalValue), icon: FileSignature, iconColor: 'pink' },
  ];

  const filteredContracts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contracts.filter((c) => {
      const linkedOrder = findLinkedOrder(c);

      if (statusTab !== 'all' && c.status !== statusTab) return false;

      if (orderStatusFilter === 'NotCreated') {
        if (linkedOrder) return false;
      } else if (orderStatusFilter !== 'All' && linkedOrder?.status !== orderStatusFilter) {
        return false;
      }

      if (paymentStatusFilter === 'None') {
        if (linkedOrder) return false;
      } else if (paymentStatusFilter !== 'All' && linkedOrder?.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      if (startDate && c.createdAt < startDate) return false;
      if (endDate && c.createdAt > endDate) return false;

      if (!term) return true;
      return (
        c.id.toLowerCase().includes(term) ||
        c.customerName.toLowerCase().includes(term) ||
        c.venue.toLowerCase().includes(term) ||
        c.packageType.toLowerCase().includes(term) ||
        c.coordinatorName.toLowerCase().includes(term)
      );
    });
  }, [contracts, findLinkedOrder, search, statusTab, orderStatusFilter, paymentStatusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredContracts.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredContracts.length, limit };

  const handleCreate = (quotationId: string, coordinatorName: string) => {
    const contract = createContractFromQuotation(quotationId, coordinatorName);
    setContracts((prev) => [contract, ...prev]);
    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingContract) return;
    deleteAdminContract(deletingContract.id);
    setContracts((prev) => prev.filter((c) => c.id !== deletingContract.id));
    setDeletingContract(null);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusTab('all');
    setOrderStatusFilter('All');
    setPaymentStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const columns: TableColumn<AdminContract>[] = [
    {
      key: 'id',
      label: 'Mã hợp đồng',
      render: (row) => (
        <Link href={`/admin/contracts/${row.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
          {row.id}
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
      key: 'grandTotal',
      label: 'Giá trị',
      className: 'text-right font-bold text-slate-900',
      render: (row) => formatCurrency(row.grandTotal),
    },
    {
      key: 'linkedOrder',
      label: 'Đơn đặt liên kết',
      render: (row) => {
        const linkedOrder = findLinkedOrder(row);
        return linkedOrder ? (
          <Link href={`/admin/orders_audit/${linkedOrder.orderId}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
            {linkedOrder.orderId}
          </Link>
        ) : (
          <span className="text-xs italic text-slate-300">—</span>
        );
      },
    },
    {
      key: 'orderStatus',
      label: 'Trạng thái Đơn',
      className: 'text-center',
      render: (row) => {
        const linkedOrder = findLinkedOrder(row);
        return linkedOrder ? (
          <Badge variant={BOOKING_STATUS_META[linkedOrder.status].variant}>{BOOKING_STATUS_META[linkedOrder.status].label}</Badge>
        ) : (
          <Badge variant="neutral">Chưa tạo đơn</Badge>
        );
      },
    },
    {
      key: 'paymentStatus',
      label: 'Thanh toán',
      className: 'text-center',
      render: (row) => {
        const linkedOrder = findLinkedOrder(row);
        return linkedOrder ? (
          <Badge variant={PAYMENT_STATUS_META[linkedOrder.paymentStatus].variant}>{PAYMENT_STATUS_META[linkedOrder.paymentStatus].label}</Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái HĐ',
      render: (row) => <Badge variant={CONTRACT_STATUS_META[row.status].variant}>{CONTRACT_STATUS_META[row.status].label}</Badge>,
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/contracts/${row.id}`}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDeletingContract(row)}
            aria-label="Xóa hợp đồng"
            title="Xóa hợp đồng"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hợp đồng</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý hợp đồng tiệc cưới được khởi tạo từ báo giá đã duyệt và dùng để tạo đơn đặt.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Khởi tạo hợp đồng
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
              placeholder="Tìm theo mã HĐ, khách hàng, sảnh..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-sm hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Đơn hàng:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-2.5 pr-8 text-xs hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ORDER_STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thanh toán:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
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
                title="Từ ngày"
                className="w-28 border-none bg-transparent py-0.5 text-xs text-slate-700 focus:outline-none"
              />
              <span className="text-xs text-slate-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Đến ngày"
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
          <Table columns={columns} rows={pageRows} rowKey={(row) => row.id} />
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <ContractCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} />

      <Modal
        isOpen={Boolean(deletingContract)}
        onClose={() => setDeletingContract(null)}
        title="Xóa hợp đồng"
        subtitle={deletingContract ? `Bạn có chắc muốn xóa hợp đồng "${deletingContract.id}"? Hành động này không thể hoàn tác.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingContract(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa hợp đồng
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
