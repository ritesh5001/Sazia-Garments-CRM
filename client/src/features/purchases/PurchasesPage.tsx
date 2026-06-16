import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceStatusBadge } from '@/features/invoices/statusBadge';
import { listPurchases, deletePurchase } from '@/api/purchases';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR, formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Purchase, PurchaseStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

function vendorName(p: Purchase): string {
  return typeof p.vendor === 'string' ? '—' : p.vendor.name;
}

export function PurchasesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [deleting, setDeleting] = useState<Purchase | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', { search: debouncedSearch, status, page }],
    queryFn: () =>
      listPurchases({
        search: debouncedSearch,
        status: (status || undefined) as PurchaseStatus | undefined,
        page,
        limit: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePurchase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase deleted, stock adjusted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Purchase>[] = [
    {
      header: 'Purchase #',
      cell: (p) => <span className="font-medium text-slate-800">{p.purchaseNumber}</span>,
    },
    { header: 'Vendor', cell: vendorName },
    { header: 'Vendor Bill', cell: (p) => p.vendorInvoiceNumber || '—' },
    { header: 'Date', cell: (p) => formatDate(p.date) },
    { header: 'Total', className: 'text-right', cell: (p) => formatINR(p.total) },
    { header: 'Paid', className: 'text-right', cell: (p) => formatINR(p.amountPaid) },
    { header: 'Status', cell: (p) => <InvoiceStatusBadge status={p.status} /> },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (p) =>
        user?.role === 'admin' ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(p)}>
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchases"
        subtitle="Record vendor bills; received stock is added automatically."
        actions={
          <Button onClick={() => navigate('/purchases/new')}>
            <Plus size={16} /> New Purchase
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search purchase or vendor bill no…"
        />
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p._id}
        loading={isLoading}
        emptyMessage="No purchases yet. Record your first vendor bill."
        onRowClick={(p) => navigate(`/purchases/${p._id}`)}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        message={`Delete purchase ${deleting?.purchaseNumber}? Received stock will be reversed.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
