import api from './client';
import type { Vendor, ListQuery, ListResponse } from '@/types';

export type VendorPayload = Omit<Vendor, '_id' | 'createdAt' | 'updatedAt'>;

export async function listVendors(query: ListQuery): Promise<ListResponse<Vendor>> {
  const { data } = await api.get<ListResponse<Vendor>>('/vendors', { params: query });
  return data;
}

export async function getVendor(id: string): Promise<Vendor> {
  const { data } = await api.get<{ data: Vendor }>(`/vendors/${id}`);
  return data.data;
}

export async function createVendor(payload: Partial<VendorPayload>): Promise<Vendor> {
  const { data } = await api.post<{ data: Vendor }>('/vendors', payload);
  return data.data;
}

export async function updateVendor(id: string, payload: Partial<VendorPayload>): Promise<Vendor> {
  const { data } = await api.patch<{ data: Vendor }>(`/vendors/${id}`, payload);
  return data.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await api.delete(`/vendors/${id}`);
}
