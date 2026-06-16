import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './ledger.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler(controller.summary));
router.get('/customer/:id', asyncHandler(controller.customer));
router.get('/vendor/:id', asyncHandler(controller.vendor));

export default router;
