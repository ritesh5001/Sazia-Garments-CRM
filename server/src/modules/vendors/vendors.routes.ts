import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { vendorSchema, vendorUpdateSchema } from './vendors.validators.js';
import * as controller from './vendors.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', validateBody(vendorSchema), asyncHandler(controller.create));
router.patch('/:id', validateBody(vendorUpdateSchema), asyncHandler(controller.update));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
