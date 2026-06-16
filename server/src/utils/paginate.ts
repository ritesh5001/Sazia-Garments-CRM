import type { FilterQuery, Model } from 'mongoose';
import type { Request } from 'express';

export interface ListParams {
  page: number;
  limit: number;
  search: string;
  sort: string;
}

export interface ListResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Parse common list query params (?page=&limit=&search=&sort=) from a request. */
export function parseListParams(req: Request): ListParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const sort = typeof req.query.sort === 'string' && req.query.sort ? req.query.sort : '-createdAt';
  return { page, limit, search, sort };
}

/** Run a paginated, optionally-searched query against a model. */
export async function paginate<T>(
  model: Model<T>,
  params: ListParams,
  filter: FilterQuery<T> = {}
): Promise<ListResult<T>> {
  const { page, limit, sort } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(filter).select('-__v').sort(sort).skip(skip).limit(limit).lean<T[]>(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Build a case-insensitive OR-regex filter across the given fields. */
export function searchFilter<T>(search: string, fields: string[]): FilterQuery<T> {
  if (!search) return {} as FilterQuery<T>;
  const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { $or: fields.map((f) => ({ [f]: rx })) } as FilterQuery<T>;
}
