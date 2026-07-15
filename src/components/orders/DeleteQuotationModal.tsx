'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { quotationApiService } from '@/services/quotation.service';
import type { Quotation } from '@/types/quotation';

interface DeleteQuotationModalProps {
  isOpen: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Quy tắc nghiệp vụ (CLAUDE.md — Xóa draft): Quotation chỉ xóa được khi còn ở trạng thái DRAFT
// (DELETE /quotations/:id chỉ xóa được khi chưa APPROVED). Backend là nơi enforce rule này (trả 400
// nếu không còn draft) — modal chỉ được mở từ nút đã ẩn theo status !== 'DRAFT'.
export default function DeleteQuotationModal({ isOpen, quotation, onClose, onSuccess }: Readonly<DeleteQuotationModalProps>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!quotation) return;
    setIsDeleting(true);
    setError(null);
    try {
      await quotationApiService.deleteQuotation(quotation.quotationId);
      onSuccess();
      resetAndClose();
    } catch {
      setError('Không thể xóa báo giá. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!quotation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => (isDeleting ? null : resetAndClose())}
      title="Xóa bản nháp báo giá"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Xác nhận xóa
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium leading-relaxed text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Thao tác này không thể hoàn tác. Bản nháp báo giá sẽ bị xóa vĩnh viễn khỏi hệ thống.</span>
        </div>

        <div className="space-y-1 rounded-lg border border-slate-200 p-3">
          <p>
            <span className="font-semibold text-slate-500">Mã báo giá:</span> #{quotation.quotationId}
          </p>
          <p>
            <span className="font-semibold text-slate-500">Phiên bản:</span> v{quotation.version}
          </p>
          <p>
            <span className="font-semibold text-slate-500">Tổng tiền:</span> {formatCurrency(quotation.totalAmount)}
          </p>
        </div>

        <p className="text-slate-600">
          Bạn có chắc chắn muốn xóa bản nháp báo giá <strong>#{quotation.quotationId}</strong> này không?
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
