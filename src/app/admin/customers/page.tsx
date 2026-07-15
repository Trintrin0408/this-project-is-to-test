'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  AdminCustomer,
  AdminCustomerStatus,
  CUSTOMER_STATUS_META,
  addAdminCustomer,
  deleteAdminCustomer,
  getAdminCustomers,
  nextAdminCustomerId,
  updateAdminCustomer,
} from '@/mocks/db/customers';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminCustomersMock.ts.

const STATUS_TABS: { value: AdminCustomerStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => getAdminCustomers());
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusTab, setStatusTab] = useState<AdminCustomerStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<AdminCustomer | null>(null);

  const tabCounts: Record<AdminCustomerStatus | 'all', number> = {
    all: customers.length,
    active: customers.filter((c) => c.status === 'active').length,
    inactive: customers.filter((c) => c.status === 'inactive').length,
  };

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusTab !== 'all' && c.status !== statusTab) return false;
      if (!term) return true;
      return (
        c.customerName.toLowerCase().includes(term) ||
        c.customerId.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    });
  }, [customers, search, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredCustomers.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredCustomers.length, limit };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const openEditModal = (customer: AdminCustomer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: Omit<AdminCustomer, 'customerId' | 'totalBookings' | 'totalSpent'>) => {
    if (editingCustomer) {
      updateAdminCustomer(editingCustomer.customerId, values);
    } else {
      addAdminCustomer({ customerId: nextAdminCustomerId(), totalBookings: 0, totalSpent: 0, ...values });
    }
    setCustomers(getAdminCustomers());
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    deleteAdminCustomer(deletingCustomer.customerId);
    setCustomers((prev) => prev.filter((c) => c.customerId !== deletingCustomer.customerId));
    setDeletingCustomer(null);
  };

  const columns: TableColumn<AdminCustomer>[] = [
    {
      key: 'customerId',
      label: 'ID',
      render: (row) => (
        <Link href={`/admin/customers/${row.customerId}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
          {row.customerId}
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
            <p className="truncate text-xs text-slate-400">{row.address.split(',').slice(-2).join(',').trim()}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Liên hệ',
      render: (row) => (
        <div className="text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {row.phone}
          </p>
          {row.email && (
            <p className="mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {row.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'totalBookings',
      label: 'Đơn đặt / Chi tiêu',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.totalBookings} đơn</p>
          <p className="text-xs text-slate-500">{formatCurrency(row.totalSpent)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <Badge variant={CUSTOMER_STATUS_META[row.status].variant}>{CUSTOMER_STATUS_META[row.status].label}</Badge>,
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      className: 'max-w-[200px]',
      render: (row) => (
        <span className="line-clamp-2 text-slate-500" title={row.notes}>
          {row.notes || 'Không có ghi chú'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/customers/${row.customerId}`}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            aria-label="Sửa khách hàng"
            title="Sửa khách hàng"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingCustomer(row)}
            aria-label="Xóa khách hàng"
            title="Xóa khách hàng"
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
          <h1 className="text-2xl font-bold text-slate-900">Khách hàng</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý hồ sơ khách hàng và lịch sử giao dịch.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Thêm khách hàng
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, SĐT, email..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={pageRows} rowKey={(row) => row.customerId} />
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <CustomerFormModal
        isOpen={isFormOpen}
        editingCustomer={editingCustomer}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        title="Xóa khách hàng"
        subtitle={deletingCustomer ? `Bạn có chắc muốn xóa hồ sơ "${deletingCustomer.customerName}"? Hành động này không thể hoàn tác.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingCustomer(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa khách hàng
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
