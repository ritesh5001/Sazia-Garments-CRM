import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { createMovement, type MovementPayload } from '@/api/products';
import { toPaise } from '@/lib/money';
import type { MovementType, Product } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product;
  type: MovementType;
}

const titles: Record<MovementType, string> = {
  inward: 'Fabric Inward Entry',
  outward: 'Fabric Outward Entry',
  adjustment: 'Stock Adjustment',
};

export function StockMovementModal({ open, onClose, product, type }: Props) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState('');
  const [rateRupees, setRateRupees] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setQuantity('');
      setRateRupees(type === 'inward' ? String(product.costPrice / 100) : '');
      setNote('');
    }
  }, [open, type, product.costPrice]);

  const mutation = useMutation({
    mutationFn: (payload: MovementPayload) => createMovement(product._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', product._id] });
      qc.invalidateQueries({ queryKey: ['movements', product._id] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-report'] });
      toast.success('Stock updated');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty === 0) {
      toast.error('Enter a non-zero quantity');
      return;
    }
    mutation.mutate({
      type,
      quantity: qty,
      rate: rateRupees ? toPaise(rateRupees) : 0,
      note,
    });
  };

  const isAdjustment = type === 'adjustment';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[type]}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="movement-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </>
      }
    >
      <form id="movement-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {product.name} — current stock:{' '}
          <span className="font-semibold text-slate-800">
            {product.currentStock} {product.unit}
          </span>
        </div>
        <Input
          id="m-qty"
          type="number"
          step="0.01"
          label={
            isAdjustment ? `Adjustment quantity (+/- ${product.unit})` : `Quantity (${product.unit})`
          }
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={isAdjustment ? 'e.g. -5 or 10' : 'e.g. 100'}
          required
        />
        {!isAdjustment && (
          <Input
            id="m-rate"
            type="number"
            step="0.01"
            label="Rate (₹/unit, optional)"
            value={rateRupees}
            onChange={(e) => setRateRupees(e.target.value)}
          />
        )}
        <Textarea
          id="m-note"
          label={isAdjustment ? 'Reason *' : 'Note'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required={isAdjustment}
        />
      </form>
    </Modal>
  );
}
