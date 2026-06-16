import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Boxes, AlertTriangle, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductFormModal } from './ProductFormModal';
import {
  listProducts,
  deleteProduct,
  getInventoryReport,
} from '@/api/products';
import { apiErrorMessage } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Product } from '@/types';

export function InventoryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search: debouncedSearch, page }],
    queryFn: () => listProducts({ search: debouncedSearch, page, limit: 20 }),
  });

  const { data: report } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: getInventoryReport,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory-report'] });
      toast.success('Product deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (p) => (
        <div>
          <div className="font-medium text-slate-800">{p.name}</div>
          {p.sku && <div className="text-xs text-slate-400">{p.sku}</div>}
        </div>
      ),
    },
    { header: 'Category', cell: (p) => p.category || '—' },
    {
      header: 'Stock',
      className: 'text-right',
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <span className={p.currentStock <= p.reorderLevel ? 'font-semibold text-rose-600' : ''}>
            {p.currentStock} {p.unit}
          </span>
          {p.currentStock <= p.reorderLevel && <Badge tone="red">Low</Badge>}
        </span>
      ),
    },
    { header: 'Cost', className: 'text-right', cell: (p) => formatINR(p.costPrice) },
    { header: 'Selling', className: 'text-right', cell: (p) => formatINR(p.sellingPrice) },
    { header: 'GST', className: 'text-right', cell: (p) => `${p.gstRate}%` },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(p);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </Button>
          {user?.role === 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(p)}>
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const kpis = [
    {
      label: 'Products',
      value: report ? String(report.totalProducts) : '—',
      icon: Boxes,
      tone: 'text-indigo-600',
    },
    {
      label: 'Inventory Value (cost)',
      value: report ? formatINR(report.inventoryValueAtCost) : '—',
      icon: IndianRupee,
      tone: 'text-emerald-600',
    },
    {
      label: 'Low Stock Items',
      value: report ? String(report.lowStockCount) : '—',
      icon: AlertTriangle,
      tone: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory & Fabric"
        subtitle="Track products, stock levels and movements."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> New Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <div className={`rounded-lg bg-slate-50 p-3 ${tone}`}>
              <Icon size={22} />
            </div>
            <div>
              <div className="text-sm text-slate-500">{label}</div>
              <div className="text-xl font-semibold text-slate-800">{value}</div>
            </div>
          </Card>
        ))}
      </div>

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search name, SKU, category…"
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p._id}
        loading={isLoading}
        emptyMessage="No products yet. Add your first fabric/product."
        onRowClick={(p) => navigate(`/inventory/${p._id}`)}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
      <ConfirmDialog
        open={!!deleting}
        message={`Delete product "${deleting?.name}"? Its stock history will also be removed.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
