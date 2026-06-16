import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ProductFormModal } from './ProductFormModal';
import { StockMovementModal } from './StockMovementModal';
import { getProduct, listMovements } from '@/api/products';
import { formatINR, formatDate } from '@/lib/money';
import type { MovementType, StockMovement } from '@/types';

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value || '—'}</div>
    </div>
  );
}

const typeTone: Record<MovementType, 'green' | 'red' | 'amber'> = {
  inward: 'green',
  outward: 'red',
  adjustment: 'amber',
};

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', id],
    queryFn: () => listMovements(id, { limit: 50 }),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!product) return <div className="text-sm text-slate-500">Product not found.</div>;

  const lowStock = product.currentStock <= product.reorderLevel;

  const columns: Column<StockMovement>[] = [
    { header: 'Date', cell: (m) => formatDate(m.createdAt) },
    {
      header: 'Type',
      cell: (m) => <Badge tone={typeTone[m.type]}>{m.type}</Badge>,
    },
    {
      header: 'Qty',
      className: 'text-right',
      cell: (m) => (
        <span className={m.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}>
          {m.quantity > 0 ? '+' : ''}
          {m.quantity} {product.unit}
        </span>
      ),
    },
    { header: 'Rate', className: 'text-right', cell: (m) => (m.rate ? formatINR(m.rate) : '—') },
    { header: 'Balance', className: 'text-right', cell: (m) => `${m.balanceAfter} ${product.unit}` },
    { header: 'Note', cell: (m) => m.note || m.reference || '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{product.name}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              {product.sku && <span className="text-xs text-slate-400">{product.sku}</span>}
              {lowStock && <Badge tone="red">Low stock</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMovementType('inward')}>
            <ArrowDownToLine size={15} /> Inward
          </Button>
          <Button variant="secondary" onClick={() => setMovementType('outward')}>
            <ArrowUpFromLine size={15} /> Outward
          </Button>
          <Button variant="secondary" onClick={() => setMovementType('adjustment')}>
            <SlidersHorizontal size={15} /> Adjust
          </Button>
          <Button variant="ghost" onClick={() => setEditOpen(true)}>
            <Pencil size={15} /> Edit
          </Button>
        </div>
      </div>

      <Card className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Current Stock" value={`${product.currentStock} ${product.unit}`} />
        <Field label="Reorder Level" value={`${product.reorderLevel} ${product.unit}`} />
        <Field label="Category" value={product.category} />
        <Field label="Cost Price" value={formatINR(product.costPrice)} />
        <Field label="Selling Price" value={formatINR(product.sellingPrice)} />
        <Field label="GST Rate" value={`${product.gstRate}%`} />
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-800">Movement History</h2>
        <DataTable
          columns={columns}
          rows={movements?.data ?? []}
          rowKey={(m) => m._id}
          emptyMessage="No stock movements yet."
        />
      </div>

      <ProductFormModal open={editOpen} onClose={() => setEditOpen(false)} product={product} />
      {movementType && (
        <StockMovementModal
          open={!!movementType}
          onClose={() => setMovementType(null)}
          product={product}
          type={movementType}
        />
      )}
    </div>
  );
}
