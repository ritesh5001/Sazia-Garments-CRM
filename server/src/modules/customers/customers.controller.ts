import type { Request, Response } from 'express';
import { parseListParams } from '../../utils/paginate.js';
import * as service from './customers.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listCustomers(parseListParams(req));
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const customer = await service.getCustomer(req.params.id);
  res.json({ data: customer });
}

export async function create(req: Request, res: Response) {
  const customer = await service.createCustomer(req.body);
  res.status(201).json({ data: customer });
}

export async function update(req: Request, res: Response) {
  const customer = await service.updateCustomer(req.params.id, req.body);
  res.json({ data: customer });
}

export async function remove(req: Request, res: Response) {
  await service.deleteCustomer(req.params.id);
  res.json({ message: 'Customer deleted' });
}
