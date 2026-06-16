import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { listCustomers } from '@/api/customers';
import { listVendors } from '@/api/vendors';
import { listInvoices } from '@/api/invoices';
import { listPurchases } from '@/api/purchases';
import { createPayment, type PaymentPayload } from '@/api/payments';
import { formatINR, toPaise, toRupees } from '@/lib/money';
import type { PaymentDirection, PaymentMode } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDirection?: PaymentDirection;
}

const MODE_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
];

interface OpenDoc {
  _id: string;
  number: string;
  balance: number; // paise
}

export function RecordPaymentModal({ open, onClose, defaultDirection = 'incoming' }: Props) {
  const qc = useQueryClient();
  const [direction, setDirection] = useState<PaymentDirection>(defaultDirection);
  const [party, setParty] = useState('');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [alloc, setAlloc] = useState<Record<string, string>>({}); // docId -> rupees
  const [amountRupees, setAmountRupees] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);

  const isIncoming = direction === 'incoming';

  useEffect(() => {
    if (open) {
      setDirection(defaultDirection);
      setParty('');
      setMode('cash');
      setReference('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setAlloc({});
      setAmountRupees('');
      setAmountTouched(false);
    }
  }, [open, defaultDirection]);

  // reset party-specific state when direction or party changes
  useEffect(() => {
    setAlloc({});
    setAmountTouched(false);
  }, [direction, party]);

  const { data: parties } = useQuery({
    queryKey: [isIncoming ? 'customers' : 'vendors', 'all'],
    queryFn: () => (isIncoming ? listCustomers({ limit: 100, sort: 'name' }) : listVendors({ limit: 100, sort: 'name' })),
    enabled: open,
  });

  const { data: openDocs = [] } = useQuery<OpenDoc[]>({
    queryKey: ['open-docs', direction, party],
    queryFn: async () => {
      const rows = isIncoming
        ? (await listInvoices({ customer: party, limit: 100 })).data.map((d) => ({
            _id: d._id,
            number: d.invoiceNumber,
            balance: d.total - d.amountPaid,
          }))
        : (await listPurchases({ vendor: party, limit: 100 })).data.map((d) => ({
            _id: d._id,
            number: d.purchaseNumber,
            balance: d.total - d.amountPaid,
          }));
      return rows.filter((d) => d.balance > 0);
    },
    enabled: open && !!party,
  });

  const allocatedTotal = useMemo(
    () => Object.values(alloc).reduce((s, v) => s + toPaise(v || '0'), 0),
    [alloc]
  );

  // keep amount synced to allocations unless the user typed their own amount
  useEffect(() => {
    if (!amountTouched) setAmountRupees(String(toRupees(allocatedTotal)));
  }, [allocatedTotal, amountTouched]);

  const setDocAlloc = (doc: OpenDoc, value: string) =>
    setAlloc((a) => ({ ...a, [doc._id]: value }));

  const mutation = useMutation({
    mutationFn: (payload: PaymentPayload) => createPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Payment recorded');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!party) return toast.error('Select a party');
    const amount = toPaise(amountRupees);
    if (amount <= 0) return toast.error('Enter an amount');
    const allocations = openDocs
      .filter((d) => toPaise(alloc[d._id] || '0') > 0)
      .map((d) => ({
        docType: (isIncoming ? 'invoice' : 'purchase') as 'invoice' | 'purchase',
        doc: d._id,
        amount: toPaise(alloc[d._id]),
      }));
    if (allocatedTotal > amount) return toast.error('Allocations exceed the payment amount');
    mutation.mutate({ direction, party, amount, mode, reference, date, allocations, note });
  };

  const partyOptions = [
    { value: '', label: isIncoming ? 'Select customer…' : 'Select vendor…' },
    ...(parties?.data ?? []).map((p) => ({ value: p._id, label: p.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Record Payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="payment-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Record'}
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('incoming')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              isIncoming ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'
            }`}
          >
            Incoming (from customer)
          </button>
          <button
            type="button"
            onClick={() => setDirection('outgoing')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              !isIncoming ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'
            }`}
          >
            Outgoing (to vendor)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={isIncoming ? 'Customer *' : 'Vendor *'}
            value={party}
            onChange={(e) => setParty(e.target.value)}
            options={partyOptions}
          />
          <Select
            label="Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentMode)}
            options={MODE_OPTIONS}
          />
          <Input label="Reference (cheque/txn no.)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {party && (
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">
              Allocate to open {isIncoming ? 'invoices' : 'purchases'}
            </div>
            {openDocs.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400">
                No outstanding {isIncoming ? 'invoices' : 'purchases'}. You can still record an advance below.
              </p>
            ) : (
              <div className="space-y-2">
                {openDocs.map((d) => (
                  <div key={d._id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-slate-800">{d.number}</span>
                      <span className="ml-2 text-slate-400">balance {formatINR(d.balance)}</span>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={alloc[d._id] ?? ''}
                        onChange={(e) => setDocAlloc(d, e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocAlloc(d, String(toRupees(d.balance)))}
                    >
                      Full
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="number"
            step="0.01"
            label="Payment Amount (₹) *"
            value={amountRupees}
            onChange={(e) => {
              setAmountTouched(true);
              setAmountRupees(e.target.value);
            }}
          />
          <div className="flex items-end text-sm text-slate-500">
            Allocated: {formatINR(allocatedTotal)}
            {toPaise(amountRupees) > allocatedTotal && (
              <span className="ml-2 text-amber-600">
                · Advance {formatINR(toPaise(amountRupees) - allocatedTotal)}
              </span>
            )}
          </div>
        </div>

        <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      </form>
    </Modal>
  );
}
