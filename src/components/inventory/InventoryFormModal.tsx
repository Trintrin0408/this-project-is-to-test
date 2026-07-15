'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Item } from '@/types/catalog';
import type { InventoryRow } from '@/types/inventory';

export interface InventoryFormValues {
  itemId: string;
  quantityChange: number;
  notes: string;
}

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  row?: InventoryRow | null;
  items: Item[];
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: InventoryFormValues) => void;
}

const EMPTY_VALUES: InventoryFormValues = {
  itemId: '',
  quantityChange: 0,
  notes: '',
};

// Mỗi Item luôn có sẵn đúng 1 bản ghi Inventory (tạo tự động khi createCatalogItem) — không có
// khái niệm "thêm mới tồn kho" ở backend, chỉ có POST /inventory/adjust (điều chỉnh delta số
// lượng). Modal này luôn là "điều chỉnh", không tách create/edit như trước.
export function InventoryFormModal({ isOpen, onClose, row, items, isSubmitting, errorMessage, onSubmit }: Readonly<InventoryFormModalProps>) {
  const [values, setValues] = useState<InventoryFormValues>(EMPTY_VALUES);
  const [validationError, setValidationError] = useState('');
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setValidationError('');
      setValues(row ? { itemId: row.itemId, quantityChange: 0, notes: '' } : EMPTY_VALUES);
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.itemId) {
      setValidationError('Vui lòng chọn thiết bị');
      return;
    }
    if (values.quantityChange === 0) {
      setValidationError('Vui lòng nhập số lượng điều chỉnh khác 0');
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
      <Button type="submit" form="inventory-form" isLoading={isSubmitting}>
        Điều chỉnh
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Điều chỉnh tồn kho" footer={footer}>
      <form id="inventory-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Thiết bị"
          required
          disabled={Boolean(row)}
          value={values.itemId}
          onChange={(e) => setValues((v) => ({ ...v, itemId: e.target.value }))}
          options={items.map((item) => ({ value: item.itemId, label: item.itemName }))}
          placeholder="Chọn thiết bị"
        />
        <Input
          label="Số lượng điều chỉnh (có thể âm)"
          type="number"
          required
          value={values.quantityChange}
          onChange={(e) => setValues((v) => ({ ...v, quantityChange: Number(e.target.value) }))}
          helpText="Số dương = nhập thêm vào kho, số âm = giảm khỏi kho"
        />
        <Input label="Ghi chú" value={values.notes} onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} />

        {(validationError || errorMessage) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-600/20">
            {validationError || errorMessage}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default InventoryFormModal;
