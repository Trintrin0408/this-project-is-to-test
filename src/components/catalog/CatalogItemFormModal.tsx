'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Item, ItemType } from '@/types/catalog';

export interface CatalogItemFormValues {
  itemCode: string;
  itemName: string;
  description: string;
  unit: string;
  rentalPrice: number;
  typeId: string;
}

interface CatalogItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  item?: Item | null;
  types: ItemType[];
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: CatalogItemFormValues) => void;
}

const EMPTY_VALUES: CatalogItemFormValues = {
  itemCode: '',
  itemName: '',
  description: '',
  unit: 'Cái',
  rentalPrice: 0,
  typeId: '',
};

export function CatalogItemFormModal({
  isOpen,
  onClose,
  mode,
  item,
  types,
  isSubmitting,
  errorMessage,
  onSubmit,
}: Readonly<CatalogItemFormModalProps>) {
  const [values, setValues] = useState<CatalogItemFormValues>(EMPTY_VALUES);
  const [validationError, setValidationError] = useState('');
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setValidationError('');
      setValues(
        mode === 'edit' && item
          ? {
              itemCode: item.itemCode,
              itemName: item.itemName,
              description: item.description ?? '',
              unit: item.unit,
              rentalPrice: item.rentalPrice,
              typeId: item.typeId,
            }
          : EMPTY_VALUES,
      );
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (values.rentalPrice <= 0) {
      setValidationError('Đơn giá thuê phải lớn hơn 0');
      return;
    }
    if (!values.typeId) {
      setValidationError('Vui lòng chọn loại thiết bị');
      return;
    }
    setValidationError('');
    onSubmit(values);
  };

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" form="catalog-item-form" isLoading={isSubmitting}>
        {mode === 'create' ? 'Tạo thiết bị' : 'Lưu thay đổi'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Tạo thiết bị mới' : 'Chỉnh sửa thiết bị'} footer={footer}>
      <form id="catalog-item-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Mã thiết bị"
          required
          disabled={mode === 'edit'}
          value={values.itemCode}
          onChange={(e) => setValues((v) => ({ ...v, itemCode: e.target.value }))}
          helpText={mode === 'edit' ? 'Không thể đổi mã sau khi tạo' : undefined}
        />
        <Input
          label="Tên thiết bị"
          required
          value={values.itemName}
          onChange={(e) => setValues((v) => ({ ...v, itemName: e.target.value }))}
        />
        <Select
          label="Nhóm sản phẩm"
          required
          value={values.typeId}
          onChange={(e) => setValues((v) => ({ ...v, typeId: e.target.value }))}
          options={types.map((t) => ({
            value: t.typeId,
            label: t.categoryName && t.categoryName !== t.typeName ? `${t.categoryName} — ${t.typeName}` : t.typeName,
          }))}
          placeholder="-- Chọn nhóm sản phẩm --"
        />
        <Input label="Đơn vị tính" required value={values.unit} onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value }))} />
        <Input
          label="Mô tả"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
        <Input
          label="Đơn giá thuê"
          type="number"
          min={0}
          required
          value={values.rentalPrice}
          onChange={(e) => setValues((v) => ({ ...v, rentalPrice: Number(e.target.value) }))}
        />

        {(validationError || errorMessage) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">
            {validationError || errorMessage}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default CatalogItemFormModal;
