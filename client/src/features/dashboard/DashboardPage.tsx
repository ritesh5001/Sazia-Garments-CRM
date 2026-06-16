import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TrendChart } from './TrendChart';
import { getDashboard, type RecentTransaction } from '@/api/dashboard';
import { formatINR, formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { Product } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const k = data?.kpis;
  const kpis = [
    { label: 'Total Sales', value: k ? formatINR(k.totalSales) : '—', icon: TrendingUp, tone: 'text-emerald-600' },
    { label: 'Total Purchases', value: k ? formatINR(k.totalPurchases) : '—', icon: ShoppingCart, tone: 'text-blue-600' },
    { label: 'Total Receivables', value: k ? formatINR(k.receivables) : '—', icon: ArrowDownCircle, tone: 'text-amber-600' },
    { label: 'Total Payables', value: k ? formatINR(k.payables) : '—', icon: ArrowUpCircle, tone: 'text-rose-600' },
    { label: 'Inventory Value (cost)', value: k ? formatINR(k.inventoryValueAtCost) : '—', icon: Boxes, tone: 'text-indigo-600' },
    { label: 'Low Stock Alerts', value: k ? String(k.lowStockCount) : '—', icon: AlertTriangle, tone: 'text-orange-600' },
  ];

  const txnColumns: Column<RecentTransaction>[] = [
    {
      header: 'Type',
      cell: (t) => (
        <Badge tone={t.kind === 'invoice' ? 'green' : t.kind === 'purchase' ? 'blue' : t.direction === 'in' ? 'green' : 'red'}>
          {t.kind}
        </Badge>
      ),
    },
    { header: 'Reference', cell: (t) => <span className="font-medium text-slate-800">{t.reference}</span> },
    { header: 'Party', cell: (t) => t.party },
    { header: 'Date', cell: (t) => formatDate(t.date) },
    {
      header: 'Amount',
      className: 'text-right',
      cell: (t) => (
        <span className={t.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'}>
          {t.direction === 'in' ? '+' : '−'}
          {formatINR(t.amount)}
        </span>
      ),
    },
  ];

  const openTxn = (t: RecentTransaction) => {
    if (t.kind === 'invoice') navigate(`/invoices/${t.id}`);
    else if (t.kind === 'purchase') navigate(`/purchases/${t.id}`);
    else navigate('/payments');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user?.name}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <div className={`rounded-lg bg-slate-50 p-3 ${tone}`}>
              <Icon size={22} />
            </div>
            <div>
              <div className="text-sm text-slate-500">{label}</div>
              <div className="text-2xl font-semibold text-slate-800">{value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-medium text-slate-800">Sales vs Purchases (6 months)</h2>
          {data ? <TrendChart data={data.trend} /> : <div className="text-sm text-slate-400">Loading…</div>}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-800">Low Stock</h2>
            <button onClick={() => navigate('/inventory')} className="text-sm text-brand-600 hover:underline">
              View all
            </button>
          </div>
          {data && data.lowStock.length > 0 ? (
            <ul className="space-y-2">
              {data.lowStock.map((p: Product) => (
                <li
                  key={p._id}
                  onClick={() => navigate(`/inventory/${p._id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{p.name}</span>
                  <Badge tone="red">
                    {p.currentStock} {p.unit}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No low-stock items. 🎉</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-800">Recent Transactions</h2>
          <ArrowRight size={16} className="text-slate-300" />
        </div>
        <DataTable
          columns={txnColumns}
          rows={data?.recentTransactions ?? []}
          rowKey={(t) => `${t.kind}-${t.id}`}
          loading={isLoading}
          emptyMessage="No transactions yet."
          onRowClick={openTxn}
        />
      </Card>
    </div>
  );
}
