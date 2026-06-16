import type { Request, Response } from 'express';
import * as service from './orders.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listOrders(req);
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const order = await service.getOrder(req.params.id);
  res.json({ data: order });
}

export async function create(req: Request, res: Response) {
  const order = await service.createOrder(req.body, req.user!.id);
  res.status(201).json({ data: order });
}

export async function update(req: Request, res: Response) {
  const order = await service.updateOrder(req.params.id, req.body);
  res.json({ data: order });
}

export async function updateStatus(req: Request, res: Response) {
  const order = await service.updateStatus(req.params.id, req.body);
  res.json({ data: order });
}

export async function remove(req: Request, res: Response) {
  await service.deleteOrder(req.params.id);
  res.json({ message: 'Order deleted' });
}
