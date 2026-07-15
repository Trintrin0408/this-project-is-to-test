import AnalyticsCard from '@/components/dashboard/AnalyticsCard';
import OrderStatusBadge from './OrderStatusBadge';
import { formatDate } from '@/utils/formatDate';
import type { OrderDetail } from '@/types/order';

interface OrderStatusHistoryTabProps {
  order: OrderDetail;
}

// Tab "Lịch sử trạng thái" — Order.status hiện chỉ lưu trạng thái hiện tại, chưa có endpoint nào
// trả lịch sử đổi trạng thái (OrderStatusHistory tồn tại trong prisma/schema.prisma thật nhưng
// không có GET nào expose) — chỉ hiển thị mốc tạo đơn + trạng thái hiện tại, không bịa lịch sử.
export default function OrderStatusHistoryTab({ order }: Readonly<OrderStatusHistoryTabProps>) {
  return (
    <AnalyticsCard title="Lịch sử trạng thái" isPlaceholder>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tạo đơn hàng</span>
          <span className="font-medium text-slate-900">{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Trạng thái hiện tại</span>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
        <p className="text-xs text-slate-400">
          Backend chưa có endpoint trả lịch sử đổi trạng thái đầy đủ — xem docs/more-require.md.
        </p>
      </div>
    </AnalyticsCard>
  );
}
