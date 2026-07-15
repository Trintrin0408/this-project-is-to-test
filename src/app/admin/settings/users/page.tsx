'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginationState } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import EmployeeFormModal, { randomAvatarColor } from '@/components/employees/EmployeeFormModal';
import {
  AdminEmployee,
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_BADGE,
  EMPLOYEE_STATUS_META,
  EmployeeRole,
  addAdminEmployee,
  deleteAdminEmployee,
  getAdminEmployees,
  nextAdminEmployeeId,
  updateAdminEmployee,
} from '@/mocks/db/employees';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminEmployeesMock.ts (trang này thay
// thế trang quản lý tài khoản/RBAC thật theo quyết định của người dùng).

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<AdminEmployee[]>(() => getAdminEmployees());
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [roleTab, setRoleTab] = useState<EmployeeRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AdminEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<AdminEmployee | null>(null);

  const roleTabs: { value: EmployeeRole | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'Tất cả', count: employees.length },
    ...EMPLOYEE_ROLES.map((role) => ({ value: role, label: role, count: employees.filter((e) => e.role === role).length })),
  ];

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (roleTab !== 'all' && e.role !== roleTab) return false;
      if (!term) return true;
      return (
        e.name.toLowerCase().includes(term) ||
        e.id.toLowerCase().includes(term) ||
        e.phone.includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.role.toLowerCase().includes(term)
      );
    });
  }, [employees, search, roleTab]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredEmployees.slice((safePage - 1) * limit, safePage * limit);
  const paginationState: PaginationState = { currentPage: safePage, totalPages, totalItems: filteredEmployees.length, limit };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEditModal = (employee: AdminEmployee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: Omit<AdminEmployee, 'id' | 'avatarColor' | 'assignedBookings'>) => {
    if (editingEmployee) {
      updateAdminEmployee(editingEmployee.id, values);
    } else {
      addAdminEmployee({ id: nextAdminEmployeeId(), avatarColor: randomAvatarColor(), assignedBookings: 0, ...values });
    }
    setEmployees(getAdminEmployees());
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEmployee) return;
    deleteAdminEmployee(deletingEmployee.id);
    setEmployees((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
    setDeletingEmployee(null);
  };

  const columns: TableColumn<AdminEmployee>[] = [
    {
      key: 'id',
      label: 'Mã NV',
      render: (row) => <span className="font-mono text-xs font-semibold text-slate-500">{row.id}</span>,
    },
    {
      key: 'name',
      label: 'Họ và tên',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${row.avatarColor}`}>
            {row.name
              .split(' ')
              .slice(-2)
              .map((p) => p[0])
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{row.name}</p>
            <p className="truncate text-xs text-slate-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò / Bộ phận',
      render: (row) => <Badge variant={EMPLOYEE_ROLE_BADGE[row.role]}>{row.role}</Badge>,
    },
    {
      key: 'contact',
      label: 'Thông tin liên hệ',
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
      key: 'assignedBookings',
      label: 'Sự kiện phụ trách',
      className: 'text-center',
      render: (row) => <span className="font-semibold text-slate-800">{row.assignedBookings}</span>,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      className: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
          <Badge variant={EMPLOYEE_STATUS_META[row.status].variant}>{EMPLOYEE_STATUS_META[row.status].label}</Badge>
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            aria-label="Sửa nhân sự"
            title="Sửa nhân sự"
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingEmployee(row)}
            aria-label="Xóa nhân sự"
            title="Xóa nhân sự"
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
          <h1 className="text-2xl font-bold text-slate-900">Nhân viên</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý nhân sự vận hành sự kiện và phân công phụ trách.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Thêm nhân sự
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
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRoleTab(tab.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  roleTab === tab.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên, SĐT, email, vai trò..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={pageRows} rowKey={(row) => row.id} />
        </div>

        <Pagination pagination={paginationState} onPageChange={setPage} />
      </motion.div>

      <EmployeeFormModal
        isOpen={isFormOpen}
        editingEmployee={editingEmployee}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        isOpen={Boolean(deletingEmployee)}
        onClose={() => setDeletingEmployee(null)}
        title="Xóa nhân sự"
        subtitle={deletingEmployee ? `Bạn có chắc muốn xóa hồ sơ "${deletingEmployee.name}"? Hành động này không thể hoàn tác.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingEmployee(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Xóa nhân sự
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
