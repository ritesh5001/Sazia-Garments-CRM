import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { paymentSchema } from './payments.validators.js';
import * as controller from './payments.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(paymentSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
