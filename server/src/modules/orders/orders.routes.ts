import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { orderSchema, orderUpdateSchema, orderStatusSchema } from './orders.validators.js';
import * as controller from './orders.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(orderSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.patch('/:id', validateBody(orderUpdateSchema), asyncHandler(controller.update));
router.patch('/:id/status', validateBody(orderStatusSchema), asyncHandler(controller.updateStatus));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
