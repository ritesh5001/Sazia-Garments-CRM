import type { Request, Response } from 'express';
import * as service from './ledger.service.js';

export async function customer(req: Request, res: Response) {
  const data = await service.customerLedger(req.params.id);
  res.json({ data });
}

export async function vendor(req: Request, res: Response) {
  const data = await service.vendorLedger(req.params.id);
  res.json({ data });
}

export async function summary(_req: Request, res: Response) {
  const data = await service.financialSummary();
  res.json({ data });
}
