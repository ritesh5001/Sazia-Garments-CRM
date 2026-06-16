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
import { createInvoice, updateInvoice, getInvoice, type InvoicePayload } from '@/api/invoices';
import { formatINR, toPaise, toRupees } from '@/lib/money';
import type { Product } from '@/types';

interface LineRow {
  product: string;
  description: string;
  quantity: string;
  rateRupees: string;
  gstRate: string;
}

const blankRow: LineRow = { product: '', description: '', quantity: '1', rateRupees: '0', gstRate: '5' };

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;

  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<LineRow[]>([{ ...blankRow }]);

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
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setCustomer(typeof existing.customer === 'string' ? existing.customer : existing.customer._id);
      setDate(existing.date.slice(0, 10));
      setNotes(existing.notes ?? '');
      setRows(
        existing.lineItems.map((l) => ({
          product: typeof l.product === 'string' ? l.product : (l.product?._id ?? ''),
          description: l.description,
          quantity: String(l.quantity),
          rateRupees: String(toRupees(l.rate)),
          gstRate: String(l.gstRate),
        }))
      );
    }
  }, [existing]);

  const setRow = (idx: number, patch: Partial<LineRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const onProductSelect = (idx: number, productId: string) => {
    const p: Product | undefined = products.find((x) => x._id === productId);
    if (p) {
      setRow(idx, {
        product: productId,
        description: p.name,
        rateRupees: String(toRupees(p.sellingPrice)),
        gstRate: String(p.gstRate),
      });
    } else {
      setRow(idx, { product: '' });
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let gst = 0;
    for (const r of rows) {
      const taxable = (Number(r.quantity) || 0) * toPaise(r.rateRupees);
      subtotal += taxable;
      gst += Math.round((taxable * (Number(r.gstRate) || 0)) / 100);
    }
    return { subtotal, gst, total: subtotal + gst };
  }, [rows]);

  const mutation = useMutation({
    mutationFn: (payload: InvoicePayload) =>
      isEdit ? updateInvoice(id!, payload) : createInvoice(payload),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEdit ? 'Invoice updated' : 'Invoice created');
      navigate(`/invoices/${inv._id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error('Select a customer');
    const lineItems = rows
      .filter((r) => r.description.trim() && Number(r.quantity) > 0)
      .map((r) => ({
        product: r.product || undefined,
        description: r.description.trim(),
        quantity: Number(r.quantity),
        rate: toPaise(r.rateRupees),
        gstRate: Number(r.gstRate) || 0,
      }));
    if (lineItems.length === 0) return toast.error('Add at least one line item');
    mutation.mutate({ customer, date, notes, lineItems });
  };

  const customerOptions = [
    { value: '', label: 'Select customer…' },
    ...(customersData?.data ?? []).map((c) => ({ value: c._id, label: c.name })),
  ];
  const productOptions = [
    { value: '', label: 'Custom item' },
    ...products.map((p) => ({ value: p._id, label: `${p.name} (${p.currentStock} ${p.unit})` })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-800">
          {isEdit ? `Edit ${existing?.invoiceNumber ?? 'Invoice'}` : 'New Invoice'}
        </h1>
      </div>

      <Card className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <Select
          id="customer"
          label="Customer *"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          options={customerOptions}
        />
        <Input id="date" type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-800">Line Items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, { ...blankRow }])}>
            <Plus size={15} /> Add Line
          </Button>
        </div>

        <div className="space-y-3">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase text-slate-400 sm:grid">
            <div className="col-span-3">Product</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Rate (₹)</div>
            <div className="col-span-1">GST%</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          {rows.map((row, idx) => {
            const taxable = (Number(row.quantity) || 0) * toPaise(row.rateRupees);
            const lineTotal = taxable + Math.round((taxable * (Number(row.gstRate) || 0)) / 100);
            return (
              <div key={idx} className="grid grid-cols-2 gap-2 sm:grid-cols-12 sm:items-center">
                <div className="col-span-2 sm:col-span-3">
                  <Select
                    value={row.product}
                    onChange={(e) => onProductSelect(idx, e.target.value)}
                    options={productOptions}
                  />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <Input
                    value={row.description}
                    onChange={(e) => setRow(idx, { description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => setRow(idx, { quantity: e.target.value })}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.rateRupees}
                    onChange={(e) => setRow(idx, { rateRupees: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.gstRate}
                    onChange={(e) => setRow(idx, { gstRate: e.target.value })}
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-medium text-slate-700">
                  {formatINR(lineTotal)}
                </div>
                <div className="col-span-1 text-right">
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
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST</span>
              <span>{formatINR(totals.gst)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>{formatINR(totals.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
