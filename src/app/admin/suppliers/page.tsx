'use client';

import { useMemo, useState } from 'react';
import { Truck, Search, Eye, Pencil, Lock, LockOpen, MapPin, Phone, Plus } from 'lucide-react';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SupplierDetailModal } from '@/components/suppliers/SupplierDetailModal';
import Reveal from '@/components/ui/Reveal';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  AdminSupplier,
  AdminSupplierFormValues,
  createAdminSupplier,
  getAdminSuppliers,
  toggleAdminSupplierStatus,
  updateAdminSupplier,
} from '@/mocks/db/suppliers';
import type { SupplierStatus } from '@/types/supplier';

// Trang thuần giao diện — xem giải thích ở đầu src/mocks/adminSuppliersMock.ts. Khớp ảnh mẫu "Danh
// sách Nhà cung cấp đối tác": tìm kiếm + lọc trạng thái, bảng đối tác kèm công nợ, modal thêm/sửa và
// modal xem chi tiết. Thêm/sửa/khóa chỉ cập nhật state cục bộ (mất khi tải lại trang).

type StatusFilter = '' | SupplierStatus;

const EMPTY_FORM: AdminSupplierFormValues = { supplierCode: '', supplierName: '', phone: '', address: '', serviceType: '' };

export default function Page() {
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>(() => getAdminSuppliers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; supplier: AdminSupplier | null } | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<AdminSupplier | null>(null);

  const refresh = () => setSuppliers(getAdminSuppliers());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!term) return true;
      return s.supplierName.toLowerCase().includes(term) || s.phone.toLowerCase().includes(term);
    });
  }, [suppliers, search, statusFilter]);

  const handleToggleStatus = (supplier: AdminSupplier) => {
    const message =
      supplier.status === 'ACTIVE'
        ? `Khóa đối tác "${supplier.supplierName}"? Đối tác sẽ không được chọn cho giao dịch mới.`
        : `Mở khóa đối tác "${supplier.supplierName}"?`;
    if (!window.confirm(message)) return;
    toggleAdminSupplierStatus(supplier.supplierId);
    refresh();
  };

  const handleSubmitForm = (values: AdminSupplierFormValues) => {
    if (formModal?.mode === 'edit' && formModal.supplier) {
      updateAdminSupplier(formModal.supplier.supplierId, values);
    } else {
      createAdminSupplier(values);
    }
    refresh();
    setFormModal(null);
  };

  const columns: TableColumn<AdminSupplier>[] = [
    { key: 'supplierCode', label: 'ID', render: (s) => <span className="font-semibold text-slate-500">{s.supplierCode}</span> },
    {
      key: 'name',
      label: 'Tên & SĐT Đối Tác',
      render: (s) => (
        <div>
          <p className="font-bold text-slate-800">{s.supplierName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {s.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Địa Chỉ & Phân Loại',
      render: (s) => (
        <div>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {s.address}
          </p>
          <span className="mt-1.5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
            {s.serviceType}
          </span>
        </div>
      ),
    },
    {
      key: 'debtBalance',
      label: 'Dư Nợ Công Nợ',
      render: (s) => <span className="font-bold text-red-500">{formatCurrency(s.debtBalance)}</span>,
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      render: (s) => (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <span className={`h-2 w-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400'}`} />
          <span className={s.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-500'}>
            {s.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </span>
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
            onClick={() => setDetailSupplier(s)}
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Chỉnh sửa"
            title="Chỉnh sửa"
            onClick={() => setFormModal({ mode: 'edit', supplier: s })}
            className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={s.status === 'ACTIVE' ? 'Khóa đối tác' : 'Mở khóa đối tác'}
            title={s.status === 'ACTIVE' ? 'Khóa đối tác' : 'Mở khóa đối tác'}
            onClick={() => handleToggleStatus(s)}
            className={
              s.status === 'ACTIVE'
                ? 'inline-flex rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                : 'inline-flex rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
            }
          >
            {s.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <Truck className="h-6 w-6 text-blue-600" />
            Danh sách Nhà cung cấp đối tác
          </h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý hồ sơ đối tác ngoài, phân loại thế mạnh và theo dõi công nợ, giao dịch lịch sử</p>
        </div>
        <Button onClick={() => setFormModal({ mode: 'create', supplier: null })}>
          <Plus className="h-4 w-4" />
          Thêm Đối Tác Mới
        </Button>
      </div>

      <Reveal className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[280px] flex-1">
            <Input
              placeholder="Tìm đối tác theo tên nhà cung cấp hoặc số điện thoại..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'INACTIVE', label: 'Ngừng hoạt động' },
              ]}
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table columns={columns} rows={filtered} rowKey={(row) => row.supplierId} />
        </div>
      </Reveal>

      <SupplierFormModal
        isOpen={!!formModal}
        mode={formModal?.mode ?? 'create'}
        supplier={formModal?.supplier ?? null}
        onClose={() => setFormModal(null)}
        onSubmit={handleSubmitForm}
      />

      <SupplierDetailModal supplier={detailSupplier} onClose={() => setDetailSupplier(null)} />
    </div>
  );
}

interface SupplierFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  supplier: AdminSupplier | null;
  onClose: () => void;
  onSubmit: (values: AdminSupplierFormValues) => void;
}

function SupplierFormModal({ isOpen, mode, supplier, onClose, onSubmit }: Readonly<SupplierFormModalProps>) {
  const [values, setValues] = useState<AdminSupplierFormValues>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setError('');
      setValues(
        mode === 'edit' && supplier
          ? {
              supplierCode: supplier.supplierCode,
              supplierName: supplier.supplierName,
              phone: supplier.phone,
              address: supplier.address,
              serviceType: supplier.serviceType,
            }
          : EMPTY_FORM,
      );
    }
  }

  const handleSubmit = () => {
    if (!values.supplierCode.trim() || !values.supplierName.trim() || !values.serviceType.trim()) {
      setError('Vui lòng nhập đủ mã, tên và phân loại đối tác');
      return;
    }
    onSubmit(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Thêm đối tác mới' : 'Chỉnh sửa đối tác'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>{mode === 'create' ? 'Thêm đối tác' : 'Lưu thay đổi'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Mã đối tác"
            required
            disabled={mode === 'edit'}
            value={values.supplierCode}
            onChange={(e) => setValues((v) => ({ ...v, supplierCode: e.target.value }))}
            placeholder="VD: SUP_ABC"
          />
          <Input
            label="Tên nhà cung cấp"
            required
            value={values.supplierName}
            onChange={(e) => setValues((v) => ({ ...v, supplierName: e.target.value }))}
            placeholder="VD: Ánh Sáng Pro"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Số điện thoại" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} placeholder="09xx xxx xxx" />
          <Input
            label="Phân loại"
            required
            value={values.serviceType}
            onChange={(e) => setValues((v) => ({ ...v, serviceType: e.target.value }))}
            placeholder="VD: Âm thanh biểu diễn"
          />
        </div>
        <Input label="Địa chỉ" value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} placeholder="Quận/huyện, tỉnh/thành" />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">{error}</p>}
      </div>
    </Modal>
  );
}
