import { Badge } from '@/components/ui/Badge';
import type { InvoiceStatus } from '@/types';

const tone: Record<InvoiceStatus, 'amber' | 'blue' | 'green'> = {
  pending: 'amber',
  partial: 'blue',
  paid: 'green',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={tone[status]}>{status}</Badge>;
}
