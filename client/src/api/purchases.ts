import api from './client';
import type { Purchase, PurchaseStatus, ListQuery, ListResponse } from '@/types';

export interface PurchaseLineInput {
  product?: string;
  description: string;
  quantity: number;
  rate: number; // paise
  gstRate: number;
}

export interface PurchasePayload {
  vendor: string;
  vendorInvoiceNumber?: string;
  date?: string;
  lineItems: PurchaseLineInput[];
  notes?: string;
}

export interface PurchaseListQuery extends ListQuery {
  vendor?: string;
  status?: PurchaseStatus;
}

export async function listPurchases(query: PurchaseListQuery): Promise<ListResponse<Purchase>> {
  const { data } = await api.get<ListResponse<Purchase>>('/purchases', { params: query });
  return data;
}

export async function getPurchase(id: string): Promise<Purchase> {
  const { data } = await api.get<{ data: Purchase }>(`/purchases/${id}`);
  return data.data;
}

export async function createPurchase(payload: PurchasePayload): Promise<Purchase> {
  const { data } = await api.post<{ data: Purchase }>('/purchases', payload);
  return data.data;
}

export async function updatePurchase(
  id: string,
  payload: Partial<PurchasePayload>
): Promise<Purchase> {
  const { data } = await api.patch<{ data: Purchase }>(`/purchases/${id}`, payload);
  return data.data;
}

export async function deletePurchase(id: string): Promise<void> {
  await api.delete(`/purchases/${id}`);
}
