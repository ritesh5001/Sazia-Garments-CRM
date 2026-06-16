import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { apiErrorMessage } from '@/api/client';
import { listCustomers } from '@/api/customers';
import { listProducts } from '@/api/products';
import { createOrder, updateOrder, getOrder, type OrderPayload } from '@/api/orders';
import { formatINR, toPaise, toRupees } from '@/lib/money';
import type { Product } from '@/types';

interface ItemRow {
  product: string;
  description: string;
  quantity: string;
  rateRupees: string;
}

const blankRow: ItemRow = { product: '', description: '', quantity: '1', rateRupees: '0' };

export function OrderFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;

  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([{ ...blankRow }]);

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => listCustomers({ limit: 100, sort: 'name' }),
  });
  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => listProducts({ limit: 100, sort: 'name' }),
  });
  const products = productsData?.data ?? [];

  const { data: existing } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setCustomer(typeof existing.customer === 'string' ? existing.customer : existing.customer._id);
      setDate(existing.date.slice(0, 10));
      setExpected(existing.expectedDeliveryDate ? existing.expectedDeliveryDate.slice(0, 10) : '');
      setNotes(existing.notes ?? '');
      setRows(
        existing.items.map((it) => ({
          product: typeof it.product === 'string' ? it.product : (it.product?._id ?? ''),
          description: it.description,
          quantity: String(it.quantity),
          rateRupees: String(toRupees(it.rate)),
        }))
      );
    }
  }, [existing]);

  const setRow = (idx: number, patch: Partial<ItemRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const onProductSelect = (idx: number, productId: string) => {
    const p: Product | undefined = products.find((x) => x._id === productId);
    if (p) {
      setRow(idx, { product: productId, description: p.name, rateRupees: String(toRupees(p.sellingPrice)) });
    } else {
      setRow(idx, { product: '' });
    }
  };

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.quantity) || 0) * toPaise(r.rateRupees), 0),
    [rows]
  );

  const mutation = useMutation({
    mutationFn: (payload: OrderPayload) => (isEdit ? updateOrder(id!, payload) : createOrder(payload)),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success(isEdit ? 'Order updated' : 'Order created');
      navigate(`/orders/${o._id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error('Select a customer');
    const items = rows
      .filter((r) => r.description.trim() && Number(r.quantity) > 0)
      .map((r) => ({
        product: r.product || undefined,
        description: r.description.trim(),
        quantity: Number(r.quantity),
        rate: toPaise(r.rateRupees),
      }));
    if (items.length === 0) return toast.error('Add at least one item');
    mutation.mutate({
      customer,
      date,
      expectedDeliveryDate: expected || undefined,
      notes,
      items,
    });
  };

  const customerOptions = [
    { value: '', label: 'Select customer…' },
    ...(customersData?.data ?? []).map((c) => ({ value: c._id, label: c.name })),
  ];
  const productOptions = [
    { value: '', label: 'Custom item' },
    ...products.map((p) => ({ value: p._id, label: p.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-800">
          {isEdit ? `Edit ${existing?.orderNumber ?? 'Order'}` : 'New Order'}
        </h1>
      </div>

      <Card className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <Select label="Customer *" value={customer} onChange={(e) => setCustomer(e.target.value)} options={customerOptions} />
        <Input type="date" label="Order Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="date" label="Expected Delivery" value={expected} onChange={(e) => setExpected(e.target.value)} />
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-800">Items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, { ...blankRow }])}>
            <Plus size={15} /> Add Item
          </Button>
        </div>

        <div className="space-y-3">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase text-slate-400 sm:grid">
            <div className="col-span-4">Product</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Rate (₹)</div>
            <div className="col-span-1" />
          </div>

          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-center">
              <div className="col-span-2 sm:col-span-4">
                <Select value={row.product} onChange={(e) => onProductSelect(idx, e.target.value)} options={productOptions} />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <Input value={row.description} onChange={(e) => setRow(idx, { description: e.target.value })} placeholder="Description" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Input type="number" step="0.01" value={row.quantity} onChange={(e) => setRow(idx, { quantity: e.target.value })} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Input type="number" step="0.01" value={row.rateRupees} onChange={(e) => setRow(idx, { rateRupees: e.target.value })} />
              </div>
              <div className="col-span-2 text-right sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, i) => i !== idx) : rs))}
                >
                  <Trash2 size={15} className="text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end text-base font-semibold text-slate-800">
          Total:&nbsp;{formatINR(total)}
        </div>
      </Card>

      <Card className="p-6">
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Order' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}
