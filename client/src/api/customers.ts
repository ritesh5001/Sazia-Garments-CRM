import api from './client';
import type { Customer, ListQuery, ListResponse } from '@/types';

export type CustomerPayload = Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>;

export async function listCustomers(query: ListQuery): Promise<ListResponse<Customer>> {
  const { data } = await api.get<ListResponse<Customer>>('/customers', { params: query });
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<{ data: Customer }>(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(payload: Partial<CustomerPayload>): Promise<Customer> {
  const { data } = await api.post<{ data: Customer }>('/customers', payload);
  return data.data;
}

export async function updateCustomer(
  id: string,
  payload: Partial<CustomerPayload>
): Promise<Customer> {
  const { data } = await api.patch<{ data: Customer }>(`/customers/${id}`, payload);
  return data.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}
