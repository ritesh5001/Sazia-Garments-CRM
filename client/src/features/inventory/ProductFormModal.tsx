import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { createProduct, updateProduct, type ProductPayload } from '@/api/products';
import { toPaise, toRupees } from '@/lib/money';
import type { Product, ProductUnit } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: 'meter', label: 'Meter' },
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kg' },
  { value: 'roll', label: 'Roll' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'set', label: 'Set' },
];

const empty = {
  name: '',
  sku: '',
  category: '',
  unit: 'meter' as ProductUnit,
  reorderLevel: '0',
  costPriceRupees: '0',
  sellingPriceRupees: '0',
  gstRate: '5',
  openingStock: '0',
};

export function ProductFormModal({ open, onClose, product }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? '',
        category: product.category ?? '',
        unit: product.unit,
        reorderLevel: String(product.reorderLevel),
        costPriceRupees: String(toRupees(product.costPrice)),
        sellingPriceRupees: String(toRupees(product.sellingPrice)),
        gstRate: String(product.gstRate),
        openingStock: '0',
      });
    } else {
      setForm(empty);
    }
  }, [product, open]);

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (payload: Partial<ProductPayload>) =>
      product ? updateProduct(product._id, payload) : createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-report'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Partial<ProductPayload> = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      unit: form.unit,
      reorderLevel: Number(form.reorderLevel) || 0,
      costPrice: toPaise(form.costPriceRupees),
      sellingPrice: toPaise(form.sellingPriceRupees),
      gstRate: Number(form.gstRate) || 0,
    };
    if (!product) payload.openingStock = Number(form.openingStock) || 0;
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={product ? 'Edit Product' : 'New Product / Fabric'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="product-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="p-name" label="Name *" value={form.name} onChange={set('name')} required />
        <Input id="p-sku" label="SKU" value={form.sku} onChange={set('sku')} />
        <Input id="p-category" label="Category" value={form.category} onChange={set('category')} />
        <Select
          id="p-unit"
          label="Unit"
          value={form.unit}
          onChange={set('unit')}
          options={UNIT_OPTIONS}
        />
        <Input
          id="p-cost"
          type="number"
          step="0.01"
          label="Cost Price (₹/unit)"
          value={form.costPriceRupees}
          onChange={set('costPriceRupees')}
        />
        <Input
          id="p-sell"
          type="number"
          step="0.01"
          label="Selling Price (₹/unit)"
          value={form.sellingPriceRupees}
          onChange={set('sellingPriceRupees')}
        />
        <Input
          id="p-gst"
          type="number"
          step="0.01"
          label="GST Rate (%)"
          value={form.gstRate}
          onChange={set('gstRate')}
        />
        <Input
          id="p-reorder"
          type="number"
          label="Reorder Level"
          value={form.reorderLevel}
          onChange={set('reorderLevel')}
        />
        {!product && (
          <Input
            id="p-opening"
            type="number"
            label="Opening Stock"
            value={form.openingStock}
            onChange={set('openingStock')}
          />
        )}
      </form>
    </Modal>
  );
}
