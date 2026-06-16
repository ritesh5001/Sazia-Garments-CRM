import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { updateOrderStatus, type OrderStatusPayload } from '@/api/orders';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function UpdateStatusModal({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  useEffect(() => {
    if (open) {
      setStatus(order.status);
      setCarrier(order.dispatch?.carrier ?? '');
      setTrackingNumber(order.dispatch?.trackingNumber ?? '');
      setReceivedBy(order.delivery?.receivedBy ?? '');
    }
  }, [open, order]);

  const mutation = useMutation({
    mutationFn: (payload: OrderStatusPayload) => updateOrderStatus(order._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', order._id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: OrderStatusPayload = { status };
    if (status === 'dispatched') payload.dispatch = { carrier, trackingNumber };
    if (status === 'delivered') payload.delivery = { receivedBy };
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Order Status"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="status-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Update'}
          </Button>
        </>
      }
    >
      <form id="status-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          options={STATUS_OPTIONS}
        />
        {status === 'dispatched' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Delhivery" />
            <Input
              label="Tracking / Docket No."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        )}
        {status === 'delivered' && (
          <Input label="Received By" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Receiver name" />
        )}
        <p className="text-xs text-slate-400">
          Dispatch and delivery dates are stamped automatically when you move to those statuses.
        </p>
      </form>
    </Modal>
  );
}
