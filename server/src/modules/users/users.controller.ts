import type { Request, Response } from 'express';
import * as service from './users.service.js';

export async function list(req: Request, res: Response) {
  const result = await service.listUsers(req);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const user = await service.createUser(req.body);
  res.status(201).json({ data: user });
}

export async function update(req: Request, res: Response) {
  const user = await service.updateUser(req.params.id, req.body, req.user!.id);
  res.json({ data: user });
}

export async function resetPassword(req: Request, res: Response) {
  const result = await service.resetPassword(req.params.id, req.body.password);
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const result = await service.deleteUser(req.params.id, req.user!.id);
  res.json(result);
}
