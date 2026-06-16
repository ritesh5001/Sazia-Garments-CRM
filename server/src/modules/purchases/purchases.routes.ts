import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { purchaseSchema, purchaseUpdateSchema } from './purchases.validators.js';
import * as controller from './purchases.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(purchaseSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.patch('/:id', validateBody(purchaseUpdateSchema), asyncHandler(controller.update));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
