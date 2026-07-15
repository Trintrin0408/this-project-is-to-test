'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supplierApiService } from '@/services/supplier.service';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// createSupplierSchema thật KHÔNG nhận `email` trong body (dù model Supplier có cột email) — bỏ
// field này khỏi form để tránh gây hiểu nhầm là lưu được. Xem D:\bnwems-backend-api
// src\validators\supplier.validator.ts.
export default function AddSupplierModal({ isOpen, onClose, onSuccess }: Readonly<AddSupplierModalProps>) {
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setSupplierCode('');
    setSupplierName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setServiceType('');
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!supplierCode.trim()) errs.supplierCode = 'Vui lòng nhập mã nhà cung cấp';
    if (!supplierName.trim()) errs.supplierName = 'Vui lòng nhập tên nhà cung cấp';
    if (!serviceType.trim()) errs.serviceType = 'Vui lòng nhập loại dịch vụ';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await supplierApiService.createSupplier({
        supplierCode: supplierCode.trim(),
        supplierName: supplierName.trim(),
        serviceType: serviceType.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? 'Thêm nhà cung cấp thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Thêm nhà cung cấp mới">
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Mã nhà cung cấp"
            required
            value={supplierCode}
            onChange={(e) => setSupplierCode(e.target.value)}
            placeholder="VD: SUP-001"
            error={errors.supplierCode}
          />
          <Input
            label="Tên nhà cung cấp"
            required
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="VD: Công ty Hoa tươi Đà Lạt"
            error={errors.supplierName}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Người liên hệ" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Họ và tên" />
          <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
        </div>
        <Input label="Địa chỉ trụ sở" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
        <Input
          label="Loại dịch vụ"
          required
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="VD: Hoa tươi & trang trí"
          error={errors.serviceType}
        />

        {submitError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">{submitError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Thêm nhà cung cấp
          </Button>
        </div>
      </div>
    </Modal>
  );
}
