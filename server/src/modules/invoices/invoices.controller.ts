import type { Request, Response } from 'express';
import * as service from './invoices.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listInvoices(req);
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const invoice = await service.getInvoice(req.params.id);
  res.json({ data: invoice });
}

export async function create(req: Request, res: Response) {
  const invoice = await service.createInvoice(req.body, req.user!.id);
  res.status(201).json({ data: invoice });
}

export async function update(req: Request, res: Response) {
  const invoice = await service.updateInvoice(req.params.id, req.body, req.user!.id);
  res.json({ data: invoice });
}

export async function remove(req: Request, res: Response) {
  await service.deleteInvoice(req.params.id, req.user!.id);
  res.json({ message: 'Invoice deleted' });
}
