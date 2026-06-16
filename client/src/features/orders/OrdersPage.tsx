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
import { OrderStatusBadge } from './statusBadge';
import { listOrders, deleteOrder } from '@/api/orders';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR, formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function customerName(o: Order): string {
  return typeof o.customer === 'string' ? '—' : o.customer.name;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [deleting, setDeleting] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { search: debouncedSearch, status, page }],
    queryFn: () =>
      listOrders({
        search: debouncedSearch,
        status: (status || undefined) as OrderStatus | undefined,
        page,
        limit: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Order>[] = [
    { header: 'Order #', cell: (o) => <span className="font-medium text-slate-800">{o.orderNumber}</span> },
    { header: 'Customer', cell: customerName },
    { header: 'Date', cell: (o) => formatDate(o.date) },
    { header: 'Expected', cell: (o) => formatDate(o.expectedDeliveryDate) },
    { header: 'Total', className: 'text-right', cell: (o) => formatINR(o.total) },
    { header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (o) =>
        user?.role === 'admin' ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(o)}>
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        subtitle="Create orders and track dispatch & delivery."
        actions={
          <Button onClick={() => navigate('/orders/new')}>
            <Plus size={16} /> New Order
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
          placeholder="Search order number…"
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
        rowKey={(o) => o._id}
        loading={isLoading}
        emptyMessage="No orders yet. Create your first order."
        onRowClick={(o) => navigate(`/orders/${o._id}`)}
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
        message={`Delete order ${deleting?.orderNumber}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
