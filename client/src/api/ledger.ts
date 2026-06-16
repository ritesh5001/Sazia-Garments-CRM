import api from './client';
import type { Ledger, FinancialSummary } from '@/types';

export async function getCustomerLedger(id: string): Promise<Ledger> {
  const { data } = await api.get<{ data: Ledger }>(`/ledger/customer/${id}`);
  return data.data;
}

export async function getVendorLedger(id: string): Promise<Ledger> {
  const { data } = await api.get<{ data: Ledger }>(`/ledger/vendor/${id}`);
  return data.data;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const { data } = await api.get<{ data: FinancialSummary }>('/ledger/summary');
  return data.data;
}
