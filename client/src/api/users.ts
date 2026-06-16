import api from './client';
import type { User, UserRole, ListQuery, ListResponse } from '@/types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function listUsers(query: ListQuery): Promise<ListResponse<User>> {
  const { data } = await api.get<ListResponse<User>>('/users', { params: query });
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<{ data: User }>('/users', payload);
  return data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.patch<{ data: User }>(`/users/${id}`, payload);
  return data.data;
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await api.patch(`/users/${id}/password`, { password });
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
