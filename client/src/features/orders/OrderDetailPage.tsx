import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, RefreshCw, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { OrderStatusBadge } from './statusBadge';
import { UpdateStatusModal } from './UpdateStatusModal';
import { getOrder } from '@/api/orders';
import { formatINR, formatDate } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { OrderItem, OrderStatus } from '@/types';

const FLOW: OrderStatus[] = ['created', 'processing', 'dispatched', 'delivered'];

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value || '—'}</div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!order) return <div className="text-sm text-slate-500">Order not found.</div>;

  const customer = typeof order.customer === 'string' ? null : order.customer;
  const cancelled = order.status === 'cancelled';
  const currentIdx = FLOW.indexOf(order.status);

  const columns: Column<OrderItem>[] = [
    { header: 'Item', cell: (i) => i.description },
    { header: 'Qty', className: 'text-right', cell: (i) => i.quantity },
    { header: 'Rate', className: 'text-right', cell: (i) => formatINR(i.rate) },
    { header: 'Total', className: 'text-right', cell: (i) => formatINR(i.lineTotal) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-semibold text-slate-800">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/orders/${order._id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button onClick={() => setStatusOpen(true)}>
            <RefreshCw size={15} /> Update Status
          </Button>
        </div>
      </div>

      {/* Status timeline */}
      {!cancelled ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {FLOW.map((step, i) => {
              const done = i <= currentIdx;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                        done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {done ? <Check size={16} /> : i + 1}
                    </div>
                    <span className={cn('mt-1 text-xs capitalize', done ? 'text-brand-700' : 'text-slate-400')}>
                      {step}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className={cn('mx-2 h-0.5 flex-1', i < currentIdx ? 'bg-brand-600' : 'bg-slate-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center text-sm font-medium text-rose-600">This order was cancelled.</Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Order</h3>
          <div className="space-y-3">
            <Field label="Customer" value={customer?.name} />
            <Field label="Order Date" value={formatDate(order.date)} />
            <Field label="Expected Delivery" value={formatDate(order.expectedDeliveryDate)} />
            <Field label="Total" value={formatINR(order.total)} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Dispatch</h3>
          <div className="space-y-3">
            <Field label="Carrier" value={order.dispatch?.carrier} />
            <Field label="Tracking / Docket" value={order.dispatch?.trackingNumber} />
            <Field label="Dispatched At" value={formatDate(order.dispatch?.dispatchedAt)} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Delivery</h3>
          <div className="space-y-3">
            <Field label="Delivered At" value={formatDate(order.delivery?.deliveredAt)} />
            <Field label="Received By" value={order.delivery?.receivedBy} />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-800">Items</h2>
        <DataTable
          columns={columns}
          rows={order.items}
          rowKey={(i) => `${i.description}-${i.quantity}-${i.rate}`}
          emptyMessage="No items."
        />
      </div>

      {order.notes && (
        <Card className="p-6 text-sm text-slate-600">
          <span className="font-medium">Notes: </span>
          {order.notes}
        </Card>
      )}

      <UpdateStatusModal open={statusOpen} onClose={() => setStatusOpen(false)} order={order} />
    </div>
  );
}
