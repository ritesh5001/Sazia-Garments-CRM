import { Invoice } from '../../models/Invoice.js';
import { Purchase } from '../../models/Purchase.js';
import { Payment } from '../../models/Payment.js';
import { financialSummary } from '../ledger/ledger.service.js';
import { inventoryReport } from '../products/products.service.js';

export interface RecentTransaction {
  id: string;
  kind: 'invoice' | 'purchase' | 'payment';
  reference: string;
  party: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
}

interface PopulatedParty {
  name?: string;
}

async function recentTransactions(): Promise<RecentTransaction[]> {
  const [invoices, purchases, payments] = await Promise.all([
    Invoice.find().sort('-createdAt').limit(6).populate('customer', 'name').lean(),
    Purchase.find().sort('-createdAt').limit(6).populate('vendor', 'name').lean(),
    Payment.find().sort('-createdAt').limit(6).populate('party', 'name').lean(),
  ]);

  const txns: (RecentTransaction & { sortKey: number })[] = [];

  for (const inv of invoices) {
    txns.push({
      id: String(inv._id),
      kind: 'invoice',
      reference: inv.invoiceNumber,
      party: (inv.customer as PopulatedParty)?.name ?? '—',
      amount: inv.total,
      direction: 'in',
      date: (inv.date as Date).toISOString(),
      sortKey: new Date(inv.date).getTime(),
    });
  }
  for (const pur of purchases) {
    txns.push({
      id: String(pur._id),
      kind: 'purchase',
      reference: pur.purchaseNumber,
      party: (pur.vendor as PopulatedParty)?.name ?? '—',
      amount: pur.total,
      direction: 'out',
      date: (pur.date as Date).toISOString(),
      sortKey: new Date(pur.date).getTime(),
    });
  }
  for (const pay of payments) {
    txns.push({
      id: String(pay._id),
      kind: 'payment',
      reference: pay.paymentNumber,
      party: (pay.party as PopulatedParty)?.name ?? '—',
      amount: pay.amount,
      direction: pay.direction === 'incoming' ? 'in' : 'out',
      date: (pay.date as Date).toISOString(),
      sortKey: new Date(pay.date).getTime(),
    });
  }

  return txns
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 8)
    .map(({ sortKey: _sortKey, ...rest }) => rest);
}

async function monthlyTrend() {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const group = {
    _id: { y: { $year: '$date' }, m: { $month: '$date' } },
    total: { $sum: '$total' },
  };

  const [sales, purchases] = await Promise.all([
    Invoice.aggregate([{ $match: { date: { $gte: start } } }, { $group: group }]),
    Purchase.aggregate([{ $match: { date: { $gte: start } } }, { $group: group }]),
  ]);

  const key = (y: number, m: number) => `${y}-${m}`;
  const salesMap = new Map(sales.map((s) => [key(s._id.y, s._id.m), s.total]));
  const purchaseMap = new Map(purchases.map((p) => [key(p._id.y, p._id.m), p.total]));

  const months: { label: string; sales: number; purchases: number }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < 6; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    months.push({
      label: cursor.toLocaleString('en-IN', { month: 'short' }),
      sales: salesMap.get(key(y, m)) ?? 0,
      purchases: purchaseMap.get(key(y, m)) ?? 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export async function getDashboard() {
  const [summary, inventory, recent, trend] = await Promise.all([
    financialSummary(),
    inventoryReport(),
    recentTransactions(),
    monthlyTrend(),
  ]);

  return {
    kpis: {
      totalSales: summary.totalSales,
      totalPurchases: summary.totalPurchases,
      receivables: summary.receivables,
      payables: summary.payables,
      inventoryValueAtCost: inventory.inventoryValueAtCost,
      lowStockCount: inventory.lowStockCount,
    },
    lowStock: inventory.lowStock.slice(0, 8),
    recentTransactions: recent,
    trend,
  };
}
