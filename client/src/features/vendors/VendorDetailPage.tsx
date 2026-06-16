import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { VendorFormModal } from './VendorFormModal';
import { InvoiceStatusBadge } from '@/features/invoices/statusBadge';
import { LedgerView } from '@/features/payments/LedgerView';
import { getVendor } from '@/api/vendors';
import { listPurchases } from '@/api/purchases';
import { getVendorLedger } from '@/api/ledger';
import { formatINR, formatDate } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { Purchase } from '@/types';

const tabs = ['Overview', 'Purchases', 'Ledger'] as const;
type Tab = (typeof tabs)[number];

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value || '—'}</div>
    </div>
  );
}

export function VendorDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Overview');
  const [editOpen, setEditOpen] = useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id),
    enabled: !!id,
  });

  const { data: purchases } = useQuery({
    queryKey: ['purchases', { vendor: id }],
    queryFn: () => listPurchases({ vendor: id, limit: 50 }),
    enabled: !!id && tab === 'Purchases',
  });

  const { data: ledger } = useQuery({
    queryKey: ['ledger', 'vendor', id],
    queryFn: () => getVendorLedger(id),
    enabled: !!id && tab === 'Ledger',
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!vendor) return <div className="text-sm text-slate-500">Vendor not found.</div>;

  const purchaseColumns: Column<Purchase>[] = [
    { header: 'Purchase #', cell: (p) => p.purchaseNumber },
    { header: 'Vendor Bill', cell: (p) => p.vendorInvoiceNumber || '—' },
    { header: 'Date', cell: (p) => formatDate(p.date) },
    { header: 'Total', className: 'text-right', cell: (p) => formatINR(p.total) },
    { header: 'Status', cell: (p) => <InvoiceStatusBadge status={p.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendors')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{vendor.name}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone={vendor.isActive ? 'green' : 'gray'}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-slate-400">Since {formatDate(vendor.createdAt)}</span>
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
          <Field label="Phone" value={vendor.phone} />
          <Field label="Email" value={vendor.email} />
          <Field label="GSTIN" value={vendor.gstin} />
          <Field label="Opening Balance" value={formatINR(vendor.openingBalance)} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Address" value={vendor.address} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Notes" value={vendor.notes} />
          </div>
        </Card>
      ) : tab === 'Purchases' ? (
        <DataTable
          columns={purchaseColumns}
          rows={purchases?.data ?? []}
          rowKey={(p) => p._id}
          emptyMessage="No purchases for this vendor yet."
          onRowClick={(p) => navigate(`/purchases/${p._id}`)}
        />
      ) : (
        <LedgerView ledger={ledger} balanceLabel="Payable" />
      )}

      <VendorFormModal open={editOpen} onClose={() => setEditOpen(false)} vendor={vendor} />
    </div>
  );
}
