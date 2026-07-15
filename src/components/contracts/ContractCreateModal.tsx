'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { CONTRACT_COORDINATOR_OPTIONS, getAvailableQuotationsForContract, nextAdminContractId } from '@/mocks/adminContractsMock';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quotationId: string, coordinatorName: string) => void;
}

export function ContractCreateModal({ isOpen, onClose, onSubmit }: Readonly<ContractCreateModalProps>) {
  const availableQuotations = getAvailableQuotationsForContract();
  const [quotationId, setQuotationId] = useState(availableQuotations[0]?.quotationId ?? '');
  const [coordinatorName, setCoordinatorName] = useState(CONTRACT_COORDINATOR_OPTIONS[0]);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setQuotationId(availableQuotations[0]?.quotationId ?? '');
      setCoordinatorName(CONTRACT_COORDINATOR_OPTIONS[0]);
    }
  }

  const handleSubmit = () => {
    if (!quotationId) return;
    onSubmit(quotationId, coordinatorName);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Hủy bỏ
      </Button>
      <Button onClick={handleSubmit} disabled={!quotationId}>
        Khởi tạo hợp đồng
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Khởi tạo hợp đồng mới" subtitle="Chuyển đổi một báo giá đã gửi/đã duyệt thành hợp đồng." footer={footer}>
      <div className="flex flex-col gap-4">
        <Input label="Mã hợp đồng *" value={nextAdminContractId()} disabled />
        {availableQuotations.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-inset ring-amber-600/20">
            Không có báo giá nào đang &quot;Đã gửi&quot;/&quot;Đã duyệt&quot; và chưa liên kết hợp đồng để khởi tạo.
          </p>
        ) : (
          <Select
            label="Chọn báo giá liên kết *"
            value={quotationId}
            onChange={(e) => setQuotationId(e.target.value)}
            options={availableQuotations.map((q) => ({
              value: q.quotationId,
              label: `${q.code} - ${q.customerName} (${formatCurrency(q.totalAmount)})`,
            }))}
          />
        )}
        <Select
          label="Nhân sự phụ trách ký duyệt"
          value={coordinatorName}
          onChange={(e) => setCoordinatorName(e.target.value)}
          options={CONTRACT_COORDINATOR_OPTIONS.map((c) => ({ value: c, label: c }))}
        />
      </div>
    </Modal>
  );
}

export default ContractCreateModal;
