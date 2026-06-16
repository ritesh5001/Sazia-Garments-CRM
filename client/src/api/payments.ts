import api from './client';
import type {
  Payment,
  PaymentDirection,
  PaymentMode,
  AllocationDocType,
  ListQuery,
  ListResponse,
} from '@/types';

export interface PaymentAllocationInput {
  docType: AllocationDocType;
  doc: string;
  amount: number;
}

export interface PaymentPayload {
  direction: PaymentDirection;
  party: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  date?: string;
  allocations: PaymentAllocationInput[];
  note?: string;
}

export interface PaymentListQuery extends ListQuery {
  direction?: PaymentDirection;
  party?: string;
  mode?: PaymentMode;
}

export async function listPayments(query: PaymentListQuery): Promise<ListResponse<Payment>> {
  const { data } = await api.get<ListResponse<Payment>>('/payments', { params: query });
  return data;
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await api.get<{ data: Payment }>(`/payments/${id}`);
  return data.data;
}

export async function createPayment(payload: PaymentPayload): Promise<Payment> {
  const { data } = await api.post<{ data: Payment }>('/payments', payload);
  return data.data;
}

export async function deletePayment(id: string): Promise<void> {
  await api.delete(`/payments/${id}`);
}
