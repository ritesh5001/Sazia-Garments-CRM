import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { customerSchema, customerUpdateSchema } from './customers.validators.js';
import * as controller from './customers.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', validateBody(customerSchema), asyncHandler(controller.create));
router.patch('/:id', validateBody(customerUpdateSchema), asyncHandler(controller.update));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
