'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AdminSupplier, AdminSupplierFormValues } from '@/mocks/db/suppliers';

const EMPTY_FORM: AdminSupplierFormValues = {
  supplierCode: '',
  supplierName: '',
  contactPerson: '',
  phone: '',
  address: '',
  serviceType: '',
};

interface SupplierFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  supplier: AdminSupplier | null;
  onClose: () => void;
  onSubmit: (values: AdminSupplierFormValues) => void;
}

/** Modal Thêm/Sửa đối tác — dùng chung cho /admin/suppliers và /manager/suppliers (trước đây khai
 * báo inline riêng trong mỗi page.tsx, gần như trùng lặp hoàn toàn — xem docs/supplier_api.md mục
 * 1.3/5/7). Bộ trường theo đúng payload đã xác nhận ở AddSupplierModal.tsx (có `contactPerson`,
 * không có `email`), chỉ khác là vẫn ghi qua mock CRUD (`createAdminSupplier`/`updateAdminSupplier`)
 * thay vì `supplierApiService` vì `GET/PUT /suppliers` chưa có route mock lẫn backend thật. */
export function SupplierFormModal({ isOpen, mode, supplier, onClose, onSubmit }: Readonly<SupplierFormModalProps>) {
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
              contactPerson: supplier.contactPerson,
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
          <Input
            label="Người liên hệ"
            value={values.contactPerson}
            onChange={(e) => setValues((v) => ({ ...v, contactPerson: e.target.value }))}
            placeholder="Họ và tên"
          />
          <Input label="Số điện thoại" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} placeholder="09xx xxx xxx" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Địa chỉ" value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} placeholder="Quận/huyện, tỉnh/thành" />
          <Input
            label="Phân loại"
            required
            value={values.serviceType}
            onChange={(e) => setValues((v) => ({ ...v, serviceType: e.target.value }))}
            placeholder="VD: Âm thanh biểu diễn"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">{error}</p>}
      </div>
    </Modal>
  );
}

export default SupplierFormModal;
