import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { loginSchema, registerAdminSchema } from './auth.validators.js';
import * as controller from './auth.controller.js';

const router = Router();

router.get('/setup-status', asyncHandler(controller.setupStatus));
router.post('/register', validateBody(registerAdminSchema), asyncHandler(controller.registerFirstAdmin));
router.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.get('/me', authenticate, asyncHandler(controller.me));

export default router;
