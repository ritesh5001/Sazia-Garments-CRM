import api from './client';
import type { Order, OrderStatus, ListQuery, ListResponse } from '@/types';

export interface OrderItemInput {
  product?: string;
  description: string;
  quantity: number;
  rate: number; // paise
}

export interface OrderPayload {
  customer: string;
  date?: string;
  expectedDeliveryDate?: string;
  items: OrderItemInput[];
  linkedInvoice?: string;
  notes?: string;
}

export interface OrderStatusPayload {
  status: OrderStatus;
  dispatch?: { carrier?: string; trackingNumber?: string; dispatchedAt?: string };
  delivery?: { deliveredAt?: string; receivedBy?: string };
}

export interface OrderListQuery extends ListQuery {
  customer?: string;
  status?: OrderStatus;
}

export async function listOrders(query: OrderListQuery): Promise<ListResponse<Order>> {
  const { data } = await api.get<ListResponse<Order>>('/orders', { params: query });
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<{ data: Order }>(`/orders/${id}`);
  return data.data;
}

export async function createOrder(payload: OrderPayload): Promise<Order> {
  const { data } = await api.post<{ data: Order }>('/orders', payload);
  return data.data;
}

export async function updateOrder(id: string, payload: Partial<OrderPayload>): Promise<Order> {
  const { data } = await api.patch<{ data: Order }>(`/orders/${id}`, payload);
  return data.data;
}

export async function updateOrderStatus(id: string, payload: OrderStatusPayload): Promise<Order> {
  const { data } = await api.patch<{ data: Order }>(`/orders/${id}/status`, payload);
  return data.data;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
}
