'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AdminCustomer, AdminCustomerStatus, nextAdminCustomerId } from '@/mocks/db/customers';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer?: AdminCustomer | null;
  onSubmit: (values: Omit<AdminCustomer, 'customerId' | 'totalBookings' | 'totalSpent'>) => void;
}

const textareaClassName =
  'block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

function emptyValues(): Omit<AdminCustomer, 'customerId' | 'totalBookings' | 'totalSpent'> {
  return { customerName: '', phone: '', email: '', address: '', notes: '', status: 'active' };
}

export function CustomerFormModal({ isOpen, onClose, editingCustomer, onSubmit }: Readonly<CustomerFormModalProps>) {
  const [values, setValues] = useState(emptyValues);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setValues(
        editingCustomer
          ? {
              customerName: editingCustomer.customerName,
              phone: editingCustomer.phone,
              email: editingCustomer.email,
              address: editingCustomer.address,
              notes: editingCustomer.notes,
              status: editingCustomer.status,
            }
          : emptyValues(),
      );
    }
  }

  const handleSubmit = () => {
    if (!values.customerName.trim() || !values.phone.trim()) return;
    onSubmit(values);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Hủy bỏ
      </Button>
      <Button onClick={handleSubmit}>Lưu hồ sơ</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCustomer ? `Chỉnh sửa khách hàng · ${editingCustomer.customerId}` : 'Thêm khách hàng'}
      subtitle={editingCustomer ? undefined : `Mã khách hàng dự kiến: ${nextAdminCustomerId()}`}
      size="lg"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <Input label="Họ và tên *" value={values.customerName} onChange={(e) => setValues((v) => ({ ...v, customerName: e.target.value }))} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Số điện thoại *" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
          <Input
            label="Thư điện tử (Email)"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
        </div>
        <Select
          label="Trạng thái vận hành"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as AdminCustomerStatus }))}
          options={[
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'inactive', label: 'Tạm ngưng' },
          ]}
        />
        <Input label="Địa chỉ khách hàng" value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="customer-notes">
            Ghi chú cụ thể
          </label>
          <textarea
            id="customer-notes"
            rows={3}
            className={textareaClassName}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

export default CustomerFormModal;
