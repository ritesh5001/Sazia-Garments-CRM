import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { invoiceSchema, invoiceUpdateSchema } from './invoices.validators.js';
import * as controller from './invoices.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(invoiceSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.patch('/:id', validateBody(invoiceUpdateSchema), asyncHandler(controller.update));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

export default router;
