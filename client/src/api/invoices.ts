import api from './client';
import type { Invoice, InvoiceStatus, ListQuery, ListResponse } from '@/types';

export interface InvoiceLineInput {
  product?: string;
  description: string;
  quantity: number;
  rate: number; // paise
  gstRate: number;
}

export interface InvoicePayload {
  customer: string;
  date?: string;
  lineItems: InvoiceLineInput[];
  notes?: string;
}

export interface InvoiceListQuery extends ListQuery {
  customer?: string;
  status?: InvoiceStatus;
}

export async function listInvoices(query: InvoiceListQuery): Promise<ListResponse<Invoice>> {
  const { data } = await api.get<ListResponse<Invoice>>('/invoices', { params: query });
  return data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data } = await api.get<{ data: Invoice }>(`/invoices/${id}`);
  return data.data;
}

export async function createInvoice(payload: InvoicePayload): Promise<Invoice> {
  const { data } = await api.post<{ data: Invoice }>('/invoices', payload);
  return data.data;
}

export async function updateInvoice(id: string, payload: Partial<InvoicePayload>): Promise<Invoice> {
  const { data } = await api.patch<{ data: Invoice }>(`/invoices/${id}`, payload);
  return data.data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`);
}
