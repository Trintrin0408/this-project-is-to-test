import { Check } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

const STEP_LABELS = ['Mới', 'Đã khảo sát', 'Đã báo giá', 'Xác nhận', 'Đang làm', 'Hoàn thành'];

// Enum OrderStatus thật chỉ có 5 giá trị (chưa có state machine chi tiết theo doc nghiệp vụ gốc —
// xem CLAUDE.md mục 1), nên 2 bước "Đã khảo sát"/"Đã báo giá" chỉ là minh họa trung gian: bất kỳ
// order nào đã qua "draft" được coi là đã khảo sát+báo giá xong (đơn không thể "confirmed" nếu
// chưa có báo giá), không phải lấy từ trạng thái thật riêng của Survey/Quotation.
function stepIndexForStatus(status: OrderStatus): number {
  if (status === 'CONFIRMED') return 3;
  if (status === 'IN_PROGRESS') return 4;
  if (status === 'COMPLETED') return 5;
  return 0; // NEW
}

interface OrderLifecycleStepperProps {
  status: OrderStatus;
}

export default function OrderLifecycleStepper({ status }: Readonly<OrderLifecycleStepperProps>) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
        Đơn hàng đã hủy
      </div>
    );
  }

  const currentIndex = stepIndexForStatus(status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start">
        {STEP_LABELS.map((label, index) => {
          const isDone = index < currentIndex || status === 'COMPLETED';
          const isCurrent = index === currentIndex && status !== 'COMPLETED';
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                {isDone && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {isCurrent && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-blue-200">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  </div>
                )}
                {!isDone && !isCurrent && <div className="h-8 w-8 rounded-full bg-slate-200" />}
                <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${isDone ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
