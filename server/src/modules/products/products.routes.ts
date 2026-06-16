import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { productSchema, productUpdateSchema, movementSchema } from './products.validators.js';
import * as controller from './products.controller.js';

const router = Router();

router.use(authenticate);

// Inventory report (must precede /:id)
router.get('/report', asyncHandler(controller.report));

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(productSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.patch('/:id', validateBody(productUpdateSchema), asyncHandler(controller.update));
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove));

// Stock movements
router.get('/:id/movements', asyncHandler(controller.listMovements));
router.post('/:id/movements', validateBody(movementSchema), asyncHandler(controller.createMovement));

export default router;
