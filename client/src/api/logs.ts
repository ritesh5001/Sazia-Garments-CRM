import api from './client';
import type { ListQuery, ListResponse } from '@/types';

export interface ActivityLog {
  _id: string;
  user?: { _id: string; name: string; email: string };
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  method: string;
  path: string;
  createdAt: string;
}

export interface LogQuery extends ListQuery {
  entityType?: string;
  action?: string;
}

export async function listLogs(query: LogQuery): Promise<ListResponse<ActivityLog>> {
  const { data } = await api.get<ListResponse<ActivityLog>>('/logs', { params: query });
  return data;
}
