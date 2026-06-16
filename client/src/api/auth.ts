import api from './client';
import type { User } from '@/types';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerFirstAdmin(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function refreshToken(): Promise<string> {
  const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
  return data.accessToken;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getSetupStatus(): Promise<{ needsSetup: boolean }> {
  const { data } = await api.get<{ needsSetup: boolean }>('/auth/setup-status');
  return data;
}
