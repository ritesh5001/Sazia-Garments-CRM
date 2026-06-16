import api from './client';
import type {
  Product,
  StockMovement,
  InventoryReport,
  MovementType,
  ListQuery,
  ListResponse,
} from '@/types';

export type ProductPayload = Omit<
  Product,
  '_id' | 'createdAt' | 'updatedAt' | 'currentStock'
> & { openingStock?: number };

export interface MovementPayload {
  type: MovementType;
  quantity: number;
  rate?: number;
  note?: string;
  reference?: string;
}

export async function listProducts(query: ListQuery): Promise<ListResponse<Product>> {
  const { data } = await api.get<ListResponse<Product>>('/products', { params: query });
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<{ data: Product }>(`/products/${id}`);
  return data.data;
}

export async function createProduct(payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.post<{ data: Product }>('/products', payload);
  return data.data;
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  const { data } = await api.patch<{ data: Product }>(`/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function createMovement(
  productId: string,
  payload: MovementPayload
): Promise<StockMovement> {
  const { data } = await api.post<{ data: StockMovement }>(`/products/${productId}/movements`, payload);
  return data.data;
}

export async function listMovements(
  productId: string,
  query: ListQuery
): Promise<ListResponse<StockMovement>> {
  const { data } = await api.get<ListResponse<StockMovement>>(`/products/${productId}/movements`, {
    params: query,
  });
  return data;
}

export async function getInventoryReport(): Promise<InventoryReport> {
  const { data } = await api.get<{ data: InventoryReport }>('/products/report');
  return data.data;
}
