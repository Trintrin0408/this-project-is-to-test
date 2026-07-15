'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/utils/formatCurrency';
import { settlementApiService } from '@/services/settlement.service';

interface RecordSettlementModalProps {
  isOpen: boolean;
  orderId: string;
  orderTotal: number;
  depositCollected: number;
  onClose: () => void;
  onSuccess: () => void;
}

// POST /api/v1/orders/:id/settlement — server tự tính finalAmount = totalAmount + additionalFee +
// compensation - depositAmount(SUCCESS) - discount. FE chỉ nhập 3 field điều chỉnh, không tự tính.
export default function RecordSettlementModal({
  isOpen,
  orderId,
  orderTotal,
  depositCollected,
  onClose,
  onSuccess,
}: Readonly<RecordSettlementModalProps>) {
  const [additionalFee, setAdditionalFee] = useState('0');
  const [compensation, setCompensation] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedFinal =
    orderTotal + (Number(additionalFee) || 0) + (Number(compensation) || 0) - depositCollected - (Number(discount) || 0);

  const resetAndClose = () => {
    setAdditionalFee('0');
    setCompensation('0');
    setDiscount('0');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await settlementApiService.recordSettlement(orderId, {
        additionalFee: Number(additionalFee) || 0,
        compensation: Number(compensation) || 0,
        discount: Number(discount) || 0,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      resetAndClose();
    } catch {
      setError('Không thể lập biên bản quyết toán. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Lập biên bản quyết toán"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Lập biên bản
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          type="number"
          label="Phụ thu phát sinh"
          value={additionalFee}
          onChange={(e) => setAdditionalFee(e.target.value)}
        />
        <Input
          type="number"
          label="Bồi thường hư hỏng/mất (khách đền bù)"
          value={compensation}
          onChange={(e) => setCompensation(e.target.value)}
        />
        <Input type="number" label="Giảm trừ/Ưu đãi" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <Select
          label="Phương thức thanh toán"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: 'cash', label: 'Tiền mặt' },
            { value: 'bank_transfer', label: 'Chuyển khoản' },
          ]}
        />
        <Input label="Ghi chú (không bắt buộc)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
          <span className="font-semibold text-slate-600">Ước tính cần thu cuối:</span>
          <span className="text-lg font-extrabold text-blue-600">{formatCurrency(estimatedFinal)}</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
