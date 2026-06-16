import { Badge } from '@/components/ui/Badge';
import type { OrderStatus } from '@/types';

const tone: Record<OrderStatus, 'gray' | 'blue' | 'amber' | 'green' | 'red'> = {
  created: 'gray',
  processing: 'blue',
  dispatched: 'amber',
  delivered: 'green',
  cancelled: 'red',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={tone[status]}>{status}</Badge>;
}
