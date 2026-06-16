import {
  TrendingUp,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';

const kpis = [
  { label: 'Total Sales', value: '—', icon: TrendingUp, tone: 'text-emerald-600' },
  { label: 'Total Purchases', value: '—', icon: ShoppingCart, tone: 'text-blue-600' },
  { label: 'Total Receivables', value: '—', icon: ArrowDownCircle, tone: 'text-amber-600' },
  { label: 'Total Payables', value: '—', icon: ArrowUpCircle, tone: 'text-rose-600' },
  { label: 'Inventory Value', value: '—', icon: Boxes, tone: 'text-indigo-600' },
  { label: 'Low Stock Alerts', value: '—', icon: AlertTriangle, tone: 'text-orange-600' },
];

export function DashboardPage() {
  const { user } = useAuth();

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

      <Card className="p-6">
        <h2 className="mb-1 text-lg font-medium text-slate-800">Recent Transactions</h2>
        <p className="text-sm text-slate-400">
          Live KPIs and recent activity will populate here as modules are built (Phase 8).
        </p>
      </Card>
    </div>
  );
}
