'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { BusinessPolicy, PolicyType } from '@/types/policy';

export interface PolicyFormValues {
  policyCode: string;
  policyName: string;
  policyType: PolicyType;
  policyValue: number;
  unit: string;
  description: string;
  isActive: boolean;
}

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  policy?: BusinessPolicy | null;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: PolicyFormValues) => void;
}

const POLICY_TYPE_OPTIONS: { value: PolicyType; label: string }[] = [
  { value: 'DEPOSIT', label: 'Đặt cọc' },
  { value: 'CANCELLATION', label: 'Hủy đơn & hoàn cọc' },
  { value: 'COMPENSATION', label: 'Đền bù thiết bị' },
  { value: 'FEE', label: 'Phụ phí' },
  { value: 'WAGE', label: 'Tiền công nhân sự' },
];

const EMPTY_VALUES: PolicyFormValues = {
  policyCode: '',
  policyName: '',
  policyType: 'DEPOSIT',
  policyValue: 0,
  unit: '',
  description: '',
  isActive: true,
};

const textareaClassName =
  'block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

export function PolicyFormModal({ isOpen, onClose, mode, policy, isSubmitting, errorMessage, onSubmit }: Readonly<PolicyFormModalProps>) {
  const [values, setValues] = useState<PolicyFormValues>(EMPTY_VALUES);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setValues(
        mode === 'edit' && policy
          ? {
              policyCode: policy.policyCode,
              policyName: policy.policyName,
              policyType: policy.policyType,
              policyValue: policy.policyValue,
              unit: policy.unit,
              description: policy.description ?? '',
              isActive: policy.isActive,
            }
          : EMPTY_VALUES,
      );
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" form="policy-form" isLoading={isSubmitting}>
        {mode === 'create' ? 'Tạo chính sách' : 'Lưu thay đổi'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Tạo chính sách mới' : 'Chỉnh sửa chính sách'}
      subtitle={
        mode === 'create'
          ? 'Thêm một chính sách nghiệp vụ mới (cọc, hoàn cọc, đền bù, phụ phí, tiền công...).'
          : `Cập nhật giá trị/trạng thái của chính sách "${policy?.policyName ?? ''}".`
      }
      size="lg"
      footer={footer}
    >
      <form id="policy-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã chính sách"
            required
            disabled={mode === 'edit'}
            placeholder="VD: HOAN-COC-30"
            value={values.policyCode}
            onChange={(e) => setValues((v) => ({ ...v, policyCode: e.target.value }))}
          />
          <Select
            label="Loại chính sách"
            disabled={mode === 'edit'}
            value={values.policyType}
            onChange={(e) => setValues((v) => ({ ...v, policyType: e.target.value as PolicyType }))}
            options={POLICY_TYPE_OPTIONS}
          />
        </div>
        <Input
          label="Tên chính sách"
          required
          disabled={mode === 'edit'}
          placeholder="VD: Hoàn cọc khi hủy đơn ≥30 ngày trước sự kiện"
          value={values.policyName}
          onChange={(e) => setValues((v) => ({ ...v, policyName: e.target.value }))}
        />
        {mode === 'edit' && (
          <p className="-mt-2 text-xs italic text-slate-400">Mã, loại và tên chính sách không thể sửa sau khi tạo — chỉ có thể đổi giá trị, đơn vị, mô tả và trạng thái.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Giá trị"
            required
            type="number"
            value={values.policyValue}
            onChange={(e) => setValues((v) => ({ ...v, policyValue: Number(e.target.value) || 0 }))}
          />
          <Input
            label="Đơn vị"
            required
            placeholder="VD: %, km, VNĐ/buổi"
            value={values.unit}
            onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="policy-description" className="text-sm font-medium text-gray-700">
            Mô tả
          </label>
          <textarea
            id="policy-description"
            rows={3}
            className={textareaClassName}
            placeholder="Mô tả ngắn gọn nội dung/điều kiện áp dụng của chính sách này..."
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
        {mode === 'edit' && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Đang áp dụng</span>
          </label>
        )}

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">{errorMessage}</p>
        )}
      </form>
    </Modal>
  );
}

export default PolicyFormModal;
