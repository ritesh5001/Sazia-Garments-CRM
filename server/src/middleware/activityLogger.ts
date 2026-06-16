import type { NextFunction, Request, Response } from 'express';
import { ActivityLog, type ActivityAction } from '../models/ActivityLog.js';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function actionFor(method: string): ActivityAction {
  if (method === 'POST') return 'create';
  if (method === 'DELETE') return 'delete';
  return 'update';
}

/**
 * Write-through audit logger: after any successful mutating request from an
 * authenticated user, record who did what. Skips auth routes and read methods.
 */
export function activityLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (!MUTATING.has(req.method) || res.statusCode >= 400 || !req.user) return;

    const path = req.originalUrl.split('?')[0];
    if (path.startsWith('/api/auth')) return;

    const segments = path.split('/').filter(Boolean); // ['api', 'customers', ':id']
    const entityType = segments[1] ?? 'unknown';

    ActivityLog.create({
      user: req.user.id,
      action: actionFor(req.method),
      entityType,
      entityId: req.params.id,
      method: req.method,
      path,
    }).catch(() => {
      /* never let logging break a request */
    });
  });
  next();
}
