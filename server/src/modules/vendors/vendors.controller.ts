import type { Request, Response } from 'express';
import { parseListParams } from '../../utils/paginate.js';
import * as service from './vendors.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listVendors(parseListParams(req));
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const vendor = await service.getVendor(req.params.id);
  res.json({ data: vendor });
}

export async function create(req: Request, res: Response) {
  const vendor = await service.createVendor(req.body);
  res.status(201).json({ data: vendor });
}

export async function update(req: Request, res: Response) {
  const vendor = await service.updateVendor(req.params.id, req.body);
  res.json({ data: vendor });
}

export async function remove(req: Request, res: Response) {
  await service.deleteVendor(req.params.id);
  res.json({ message: 'Vendor deleted' });
}
