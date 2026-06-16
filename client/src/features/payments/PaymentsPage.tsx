import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RecordPaymentModal } from './RecordPaymentModal';
import { listPayments, deletePayment } from '@/api/payments';
import { getFinancialSummary } from '@/api/ledger';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR, formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Payment, PaymentDirection } from '@/types';

const DIRECTION_OPTIONS = [
  { value: '', label: 'All directions' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

function partyName(p: Payment): string {
  return typeof p.party === 'string' ? '—' : p.party.name;
}

export function PaymentsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formDirection, setFormDirection] = useState<PaymentDirection>('incoming');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { search: debouncedSearch, direction, page }],
    queryFn: () =>
      listPayments({
        search: debouncedSearch,
        direction: (direction || undefined) as PaymentDirection | undefined,
        page,
        limit: 20,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: getFinancialSummary,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Payment deleted, allocations reversed');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const openForm = (dir: PaymentDirection) => {
    setFormDirection(dir);
    setFormOpen(true);
  };

  const columns: Column<Payment>[] = [
    { header: 'Payment #', cell: (p) => <span className="font-medium text-slate-800">{p.paymentNumber}</span> },
    {
      header: 'Direction',
      cell: (p) => (
        <Badge tone={p.direction === 'incoming' ? 'green' : 'red'}>
          {p.direction === 'incoming' ? 'In' : 'Out'}
        </Badge>
      ),
    },
    { header: 'Party', cell: partyName },
    { header: 'Mode', cell: (p) => <span className="uppercase">{p.mode}</span> },
    { header: 'Reference', cell: (p) => p.reference || '—' },
    { header: 'Date', cell: (p) => formatDate(p.date) },
    { header: 'Amount', className: 'text-right', cell: (p) => formatINR(p.amount) },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (p) =>
        user?.role === 'admin' ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleting(p)}>
            <Trash2 size={15} className="text-rose-500" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Record money in and out; track receivables and payables."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openForm('outgoing')}>
              <ArrowUpCircle size={16} /> Pay Vendor
            </Button>
            <Button onClick={() => openForm('incoming')}>
              <Plus size={16} /> Receive Payment
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-3 p-5">
          <ArrowDownCircle className="text-amber-600" size={22} />
          <div>
            <div className="text-sm text-slate-500">Total Receivables</div>
            <div className="text-xl font-semibold text-slate-800">
              {summary ? formatINR(summary.receivables) : '—'}
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <ArrowUpCircle className="text-rose-600" size={22} />
          <div>
            <div className="text-sm text-slate-500">Total Payables</div>
            <div className="text-xl font-semibold text-slate-800">
              {summary ? formatINR(summary.payables) : '—'}
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div>
            <div className="text-sm text-slate-500">Received</div>
            <div className="text-xl font-semibold text-emerald-600">
              {summary ? formatINR(summary.totalReceived) : '—'}
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div>
            <div className="text-sm text-slate-500">Paid Out</div>
            <div className="text-xl font-semibold text-rose-600">
              {summary ? formatINR(summary.totalPaid) : '—'}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search payment or reference no…"
        />
        <div className="w-44">
          <Select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value);
              setPage(1);
            }}
            options={DIRECTION_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p._id}
        loading={isLoading}
        emptyMessage="No payments recorded yet."
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <RecordPaymentModal open={formOpen} onClose={() => setFormOpen(false)} defaultDirection={formDirection} />
      <ConfirmDialog
        open={!!deleting}
        message={`Delete payment ${deleting?.paymentNumber}? Its allocations will be reversed.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
