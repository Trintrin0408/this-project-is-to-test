'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { AdminQuotationRow } from '@/mocks/db/quotations';
import { getLinkableQuotationsForOrder } from '@/mocks/db/orders';

interface CreateOrderPickQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPicked: (quotation: AdminQuotationRow) => void;
}

// Bước chọn báo giá trước khi mở wizard tạo đơn (CreateOrderFromQuotationModal) — theo Hướng A đã chốt
// ở docs/danhsachhopdong_api.md mục 1.5: "Hợp đồng" không còn là entity riêng, khởi tạo đơn từ màn
// /admin/contracts giờ dùng thẳng luồng tạo Order từ báo giá đã duyệt (cùng luồng với nút "Tạo đơn đặt
// từ báo giá" ở trang chi tiết báo giá), chỉ khác là ở đây chưa biết trước báo giá nào nên cần 1 bước
// chọn trước khi mở wizard 5 bước.
export default function CreateOrderPickQuotationModal({ isOpen, onClose, onPicked }: Readonly<CreateOrderPickQuotationModalProps>) {
  const availableQuotations = getLinkableQuotationsForOrder();
  const [quotationId, setQuotationId] = useState(availableQuotations[0]?.quotationId ?? '');
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setQuotationId(availableQuotations[0]?.quotationId ?? '');
    }
  }

  const handleContinue = () => {
    const quotation = availableQuotations.find((q) => q.quotationId === quotationId);
    if (!quotation) return;
    onPicked(quotation);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Hủy bỏ
      </Button>
      <Button onClick={handleContinue} disabled={!quotationId}>
        Tiếp tục
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn báo giá để tạo đơn"
      subtitle="Chuyển đổi 1 báo giá đã duyệt và chưa có đơn đặt liên kết thành đơn đặt hàng chính thức."
      footer={footer}
    >
      {availableQuotations.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Không có báo giá nào đã duyệt và chưa liên kết đơn đặt để khởi tạo.
        </p>
      ) : (
        <Select
          label="Báo giá đã duyệt *"
          value={quotationId}
          onChange={(e) => setQuotationId(e.target.value)}
          options={availableQuotations.map((q) => ({
            value: q.quotationId,
            label: `${q.code} - ${q.customerName} (${formatCurrency(q.totalAmount)})`,
          }))}
        />
      )}
    </Modal>
  );
}
