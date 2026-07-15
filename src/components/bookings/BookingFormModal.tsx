'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AdminOrderRow, BookingStatus, PACKAGE_OPTIONS, VENUE_OPTIONS, nextAdminOrderId } from '@/mocks/db/orders';
import { getAdminCustomers } from '@/mocks/db/customers';

type BookingFormValues = Omit<AdminOrderRow, 'orderId' | 'checklist' | 'status' | 'paymentStatus' | 'items' | 'liveChecklist' | 'disputeLogs'>;

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinatorOptions: string[];
  editingOrder?: AdminOrderRow | null;
  onSubmit: (values: BookingFormValues) => void;
}

function emptyValues(coordinator: string): BookingFormValues {
  return {
    customerId: '',
    customerName: '',
    customerPhone: '',
    weddingDate: '',
    venue: VENUE_OPTIONS[0],
    guestCount: 100,
    totalPrice: 0,
    depositAmount: 0,
    coordinatorName: coordinator,
    packageType: PACKAGE_OPTIONS[0],
    notes: '',
  };
}

export function BookingFormModal({ isOpen, onClose, coordinatorOptions, editingOrder, onSubmit }: Readonly<BookingFormModalProps>) {
  const [values, setValues] = useState(() => emptyValues(coordinatorOptions[0] ?? ''));
  const [wasOpen, setWasOpen] = useState(isOpen);
  const customers = getAdminCustomers();

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.customerId === customerId);
    setValues((v) => ({
      ...v,
      customerId,
      customerName: customer?.customerName ?? v.customerName,
      customerPhone: customer?.phone ?? v.customerPhone,
    }));
  };

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setValues(
        editingOrder
          ? {
              customerId: editingOrder.customerId,
              customerName: editingOrder.customerName,
              customerPhone: editingOrder.customerPhone,
              weddingDate: editingOrder.weddingDate,
              venue: editingOrder.venue,
              guestCount: editingOrder.guestCount,
              totalPrice: editingOrder.totalPrice,
              depositAmount: editingOrder.depositAmount,
              coordinatorName: editingOrder.coordinatorName,
              packageType: editingOrder.packageType,
              notes: editingOrder.notes,
            }
          : emptyValues(coordinatorOptions[0] ?? ''),
      );
    }
  }

  const handleSubmit = () => {
    if (!values.customerId || !values.customerName.trim() || !values.customerPhone.trim() || !values.weddingDate || values.guestCount < 20) return;
    onSubmit(values);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Hủy bỏ
      </Button>
      <Button onClick={handleSubmit}>{editingOrder ? 'Lưu thay đổi' : 'Lưu đơn đặt'}</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOrder ? `Chỉnh sửa đơn đặt · ${editingOrder.orderId}` : 'Tạo đơn đặt lịch tiệc mới'}
      subtitle={editingOrder ? undefined : `Mã đơn đặt dự kiến: ${nextAdminOrderId()}`}
      size="lg"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Khách hàng liên kết *"
          value={values.customerId}
          onChange={(e) => handleSelectCustomer(e.target.value)}
          options={customers.map((c) => ({ value: c.customerId, label: `${c.customerName} — ${c.phone}` }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Tên liên hệ *" value={values.customerName} onChange={(e) => setValues((v) => ({ ...v, customerName: e.target.value }))} />
          <Input label="Số điện thoại *" value={values.customerPhone} onChange={(e) => setValues((v) => ({ ...v, customerPhone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Ngày tổ chức *"
            type="date"
            value={values.weddingDate}
            onChange={(e) => setValues((v) => ({ ...v, weddingDate: e.target.value }))}
          />
          <Input
            label="Số lượng khách *"
            type="number"
            min={20}
            value={values.guestCount}
            onChange={(e) => setValues((v) => ({ ...v, guestCount: Number(e.target.value) || 0 }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Gói dịch vụ"
            value={values.packageType}
            onChange={(e) => setValues((v) => ({ ...v, packageType: e.target.value }))}
            options={PACKAGE_OPTIONS.map((p) => ({ value: p, label: p }))}
          />
          <Select
            label="Sảnh tiệc"
            value={values.venue}
            onChange={(e) => setValues((v) => ({ ...v, venue: e.target.value }))}
            options={VENUE_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tổng giá trị dự kiến (VNĐ)"
            type="number"
            value={values.totalPrice || ''}
            onChange={(e) => setValues((v) => ({ ...v, totalPrice: Number(e.target.value) || 0 }))}
          />
          <Input
            label="Khoản tiền đặt cọc (VNĐ)"
            type="number"
            value={values.depositAmount || ''}
            onChange={(e) => setValues((v) => ({ ...v, depositAmount: Number(e.target.value) || 0 }))}
          />
        </div>
        <Select
          label="Điều phối viên"
          value={values.coordinatorName}
          onChange={(e) => setValues((v) => ({ ...v, coordinatorName: e.target.value }))}
          options={coordinatorOptions.map((c) => ({ value: c, label: c }))}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="booking-notes">
            Ghi chú
          </label>
          <textarea
            id="booking-notes"
            rows={3}
            className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

export default BookingFormModal;

export type { BookingStatus };
