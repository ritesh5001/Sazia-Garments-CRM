import api from './client';
import type { Product } from '@/types';

export interface RecentTransaction {
  id: string;
  kind: 'invoice' | 'purchase' | 'payment';
  reference: string;
  party: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
}

export interface DashboardData {
  kpis: {
    totalSales: number;
    totalPurchases: number;
    receivables: number;
    payables: number;
    inventoryValueAtCost: number;
    lowStockCount: number;
  };
  lowStock: Product[];
  recentTransactions: RecentTransaction[];
  trend: { label: string; sales: number; purchases: number }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<{ data: DashboardData }>('/dashboard');
  return data.data;
}
