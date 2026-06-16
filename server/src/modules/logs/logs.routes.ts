import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ActivityLog } from '../../models/ActivityLog.js';
import { parseListParams, paginate } from '../../utils/paginate.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parseListParams(req);
    const filter: Record<string, unknown> = {};
    if (typeof req.query.entityType === 'string' && req.query.entityType) filter.entityType = req.query.entityType;
    if (typeof req.query.action === 'string' && req.query.action) filter.action = req.query.action;

    const result = await paginate(ActivityLog, { ...params, sort: '-createdAt' }, filter);
    const data = await ActivityLog.populate(result.data, { path: 'user', select: 'name email' });
    res.json({ ...result, data });
  })
);

export default router;
