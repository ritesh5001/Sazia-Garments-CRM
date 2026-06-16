import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from './users.validators.js';
import * as controller from './users.controller.js';

const router = Router();

// User management is admin-only.
router.use(authenticate, requireRole('admin'));

router.get('/', asyncHandler(controller.list));
router.post('/', validateBody(createUserSchema), asyncHandler(controller.create));
router.patch('/:id', validateBody(updateUserSchema), asyncHandler(controller.update));
router.patch('/:id/password', validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.delete('/:id', asyncHandler(controller.remove));

export default router;
