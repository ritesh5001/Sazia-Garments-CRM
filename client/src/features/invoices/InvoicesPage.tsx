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
import { InvoiceStatusBadge } from './statusBadge';
import { listInvoices, deleteInvoice } from '@/api/invoices';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR, formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Invoice, InvoiceStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

function customerName(inv: Invoice): string {
  return typeof inv.customer === 'string' ? '—' : inv.customer.name;
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search: debouncedSearch, status, page }],
    queryFn: () =>
      listInvoices({
        search: debouncedSearch,
        status: (status || undefined) as InvoiceStatus | undefined,
        page,
        limit: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Invoice deleted, stock restored');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (i) => <span className="font-medium text-slate-800">{i.invoiceNumber}</span>,
    },
    { header: 'Customer', cell: customerName },
    { header: 'Date', cell: (i) => formatDate(i.date) },
    { header: 'Total', className: 'text-right', cell: (i) => formatINR(i.total) },
    { header: 'Paid', className: 'text-right', cell: (i) => formatINR(i.amountPaid) },
    { header: 'Status', cell: (i) => <InvoiceStatusBadge status={i.status} /> },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (i) =>
        user?.role === 'admin' ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(i)}>
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        subtitle="Create and track sales invoices with GST."
        actions={
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus size={16} /> New Invoice
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
          placeholder="Search invoice number…"
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
        rowKey={(i) => i._id}
        loading={isLoading}
        emptyMessage="No invoices yet. Create your first invoice."
        onRowClick={(i) => navigate(`/invoices/${i._id}`)}
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
        message={`Delete invoice ${deleting?.invoiceNumber}? Stock from its line items will be restored.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
