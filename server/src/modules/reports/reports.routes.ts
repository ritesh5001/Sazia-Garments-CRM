import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import * as service from './reports.service.js';

const router = Router();

router.use(authenticate);

router.get('/sales', asyncHandler(async (req, res) => res.json({ data: await service.salesReport(req) })));
router.get('/purchases', asyncHandler(async (req, res) => res.json({ data: await service.purchasesReport(req) })));
router.get('/payments', asyncHandler(async (req, res) => res.json({ data: await service.paymentsReport(req) })));
router.get('/inventory', asyncHandler(async (_req, res) => res.json({ data: await service.inventoryReport() })));
router.get('/customers', asyncHandler(async (_req, res) => res.json({ data: await service.customersReport() })));
router.get('/vendors', asyncHandler(async (_req, res) => res.json({ data: await service.vendorsReport() })));
router.get('/profit-loss', asyncHandler(async (req, res) => res.json({ data: await service.profitLoss(req) })));

export default router;
