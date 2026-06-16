import type { Request, Response } from 'express';
import * as service from './payments.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listPayments(req);
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const payment = await service.getPayment(req.params.id);
  res.json({ data: payment });
}

export async function create(req: Request, res: Response) {
  const payment = await service.createPayment(req.body, req.user!.id);
  res.status(201).json({ data: payment });
}

export async function remove(req: Request, res: Response) {
  await service.deletePayment(req.params.id);
  res.json({ message: 'Payment deleted' });
}
