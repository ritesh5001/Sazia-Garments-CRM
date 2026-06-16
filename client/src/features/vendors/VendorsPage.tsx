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
import { VendorFormModal } from './VendorFormModal';
import { listVendors, deleteVendor } from '@/api/vendors';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Vendor } from '@/types';

export function VendorsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { search: debouncedSearch, page }],
    queryFn: () => listVendors({ search: debouncedSearch, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Vendor>[] = [
    { header: 'Name', cell: (v) => <span className="font-medium text-slate-800">{v.name}</span> },
    { header: 'Phone', cell: (v) => v.phone || '—' },
    { header: 'Email', cell: (v) => v.email || '—' },
    { header: 'GSTIN', cell: (v) => v.gstin || '—' },
    {
      header: 'Opening Balance',
      className: 'text-right',
      cell: (v) => formatINR(v.openingBalance),
    },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (v) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(v);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </Button>
          {user?.role === 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(v)}>
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
        title="Vendors"
        subtitle="Manage suppliers, GST details and opening balances."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> New Vendor
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
        rowKey={(v) => v._id}
        loading={isLoading}
        emptyMessage="No vendors yet. Add your first vendor."
        onRowClick={(v) => navigate(`/vendors/${v._id}`)}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <VendorFormModal open={formOpen} onClose={() => setFormOpen(false)} vendor={editing} />
      <ConfirmDialog
        open={!!deleting}
        message={`Delete vendor "${deleting?.name}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
