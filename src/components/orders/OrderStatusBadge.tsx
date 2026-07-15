import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { ORDER_STATUS_LABEL } from '@/constants/order-status';
import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: Readonly<OrderStatusBadgeProps>) {
  return <Badge variant={getStatusBadgeVariant(status.toUpperCase())}>{ORDER_STATUS_LABEL[status] ?? status}</Badge>;
}
