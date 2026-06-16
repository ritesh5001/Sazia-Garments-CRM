import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerFormModal } from './CustomerFormModal';
import { listCustomers, deleteCustomer } from '@/api/customers';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Customer } from '@/types';

export function CustomersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search: debouncedSearch, page }],
    queryFn: () => listCustomers({ search: debouncedSearch, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Customer>[] = [
    { header: 'Name', cell: (c) => <span className="font-medium text-slate-800">{c.name}</span> },
    { header: 'Phone', cell: (c) => c.phone || '—' },
    { header: 'Email', cell: (c) => c.email || '—' },
    { header: 'GSTIN', cell: (c) => c.gstin || '—' },
    {
      header: 'Opening Balance',
      className: 'text-right',
      cell: (c) => formatINR(c.openingBalance),
    },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(c);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </Button>
          {user?.role === 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle="Manage customer contacts, GST details and opening balances."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> New Customer
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search name, phone, email, GSTIN…"
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(c) => c._id}
        loading={isLoading}
        emptyMessage="No customers yet. Add your first customer."
        onRowClick={(c) => navigate(`/customers/${c._id}`)}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} customer={editing} />
      <ConfirmDialog
        open={!!deleting}
        message={`Delete customer "${deleting?.name}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
