import type { Request, Response } from 'express';
import { parseListParams } from '../../utils/paginate.js';
import * as service from './products.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listProducts(parseListParams(req));
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const product = await service.getProduct(req.params.id);
  res.json({ data: product });
}

export async function create(req: Request, res: Response) {
  const product = await service.createProduct(req.body, req.user!.id);
  res.status(201).json({ data: product });
}

export async function update(req: Request, res: Response) {
  const product = await service.updateProduct(req.params.id, req.body);
  res.json({ data: product });
}

export async function remove(req: Request, res: Response) {
  await service.deleteProduct(req.params.id);
  res.json({ message: 'Product deleted' });
}

export async function createMovement(req: Request, res: Response) {
  const movement = await service.applyMovement(req.params.id, req.body, req.user!.id);
  res.status(201).json({ data: movement });
}

export async function listMovements(req: Request, res: Response) {
  const result = await service.listMovements(req.params.id, parseListParams(req));
  res.json(result);
}

export async function report(_req: Request, res: Response) {
  const data = await service.inventoryReport();
  res.json({ data });
}
