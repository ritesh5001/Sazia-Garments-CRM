import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Future module routes mount here (customers, vendors, inventory, invoices, ...)

export default router;
