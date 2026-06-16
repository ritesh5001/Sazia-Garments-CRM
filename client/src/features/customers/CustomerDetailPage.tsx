import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CustomerFormModal } from './CustomerFormModal';
import { getCustomer } from '@/api/customers';
import { formatINR, formatDate } from '@/lib/money';
import { cn } from '@/lib/cn';

const tabs = ['Overview', 'Invoices', 'Ledger', 'Orders'] as const;
type Tab = (typeof tabs)[number];

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value || '—'}</div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Overview');
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!customer) return <div className="text-sm text-slate-500">Customer not found.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{customer.name}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone={customer.isActive ? 'green' : 'gray'}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-slate-400">Since {formatDate(customer.createdAt)}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={15} /> Edit
        </Button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <Card className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
          <Field label="GSTIN" value={customer.gstin} />
          <Field label="Opening Balance" value={formatINR(customer.openingBalance)} />
          <Field label="Billing Address" value={customer.billingAddress} />
          <Field label="Shipping Address" value={customer.shippingAddress} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Notes" value={customer.notes} />
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-1 p-12 text-center">
          <p className="text-slate-500">{tab} history will appear here.</p>
          <p className="text-sm text-slate-400">
            Wired up once the {tab === 'Invoices' ? 'Invoice (Phase 4)' : tab === 'Ledger' ? 'Payments (Phase 6)' : 'Orders (Phase 7)'} module is built.
          </p>
        </Card>
      )}

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
    </div>
  );
}
