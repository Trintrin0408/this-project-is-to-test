'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Plus, RotateCcw, Search } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import CreateQuotationWizardModal from '@/components/quotations/CreateQuotationWizardModal';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { AdminQuotationRow, AdminQuotationStatus, QUOTATION_STATUS_META, getAdminQuotations } from '@/mocks/db/quotations';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminQuotationsMock.ts. Không gọi
// quotationApiService, không đồng bộ với docs/api/08-quotations.md.

export default function AdminQuotationsPage() {
  const [rows, setRows] = useState<AdminQuotationRow[]>(() => getAdminQuotations());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<AdminQuotationStatus | ''>('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const customerOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.customerName))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (statusFilter && row.status !== statusFilter) return false;
        if (customerFilter && row.customerName !== customerFilter) return false;
        if (!term) return true;
        return row.code.toLowerCase().includes(term) || row.customerName.toLowerCase().includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rows, search, statusFilter, customerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredRows.length, limit };

  const draftCount = rows.filter((r) => r.status === 'draft').length;
  const approvedRows = rows.filter((r) => r.status === 'approved');
  const rejectedCount = rows.filter((r) => r.status === 'rejected').length;
  const approvedValue = approvedRows.reduce((sum, r) => sum + r.totalAmount, 0);

  const kpiItems: { label: string; value: string; valueClassName: string }[] = [
    { label: 'Tổng báo giá', value: String(rows.length), valueClassName: 'text-slate-900' },
    { label: 'Dự thảo nháp', value: String(draftCount), valueClassName: 'text-slate-900' },
    { label: 'Đã phê duyệt', value: String(approvedRows.length), valueClassName: 'text-green-600' },
    { label: 'Bị từ chối', value: String(rejectedCount), valueClassName: 'text-red-600' },
    { label: 'Giá trị đã phê duyệt', value: formatCurrency(approvedValue), valueClassName: 'text-slate-900' },
  ];

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setCustomerFilter('');
  };

  const columns: TableColumn<AdminQuotationRow>[] = [
    {
      key: 'code',
      label: 'Mã báo giá',
      render: (row) => <span className="font-semibold text-slate-800">{row.code}</span>,
    },
    {
      key: 'customerName',
      label: 'Khách hàng',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.customerName}</p>
          <p className="text-xs text-slate-400">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'version',
      label: 'Phiên bản',
      render: (row) => <span className="text-slate-600">v{row.version}</span>,
    },
    {
      key: 'subtotal',
      label: 'Tổng trước giảm',
      className: 'text-right',
      render: (row) => <span className="text-slate-600">{formatCurrency(row.subtotal)}</span>,
    },
    {
      key: 'discount',
      label: 'Giảm giá',
      className: 'text-right',
      render: (row) => <span className="text-red-500">-{formatCurrency(row.discount)}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Tổng tiền',
      className: 'text-right font-bold text-slate-900',
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <Badge variant={QUOTATION_STATUS_META[row.status].variant}>{QUOTATION_STATUS_META[row.status].label}</Badge>,
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (row) => <span className="whitespace-nowrap text-sm text-slate-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/quotations/${row.quotationId}`}
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý báo giá</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo mới, phê duyệt, lưu nháp hoặc từ chối các báo giá sự kiện.</p>
          <p className="mt-1 text-xs italic text-slate-400">Đang hiển thị dữ liệu minh họa (giao diện thuần, chưa nối API báo giá thật).</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo báo giá mới
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.valueClassName}`}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã báo giá, tên khách..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AdminQuotationStatus | '')}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                ...(Object.keys(QUOTATION_STATUS_META) as AdminQuotationStatus[]).map((s) => ({
                  value: s,
                  label: QUOTATION_STATUS_META[s].label,
                })),
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              options={[{ value: '', label: 'Tất cả khách hàng' }, ...customerOptions.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <Button variant="secondary" className="ml-auto" onClick={handleResetFilters}>
            <RotateCcw className="h-4 w-4" />
            Làm mới bộ lọc
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={pageRows} rowKey={(row) => row.quotationId} />
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <CreateQuotationWizardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          setRows(getAdminQuotations());
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}
