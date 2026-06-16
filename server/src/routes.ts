import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import vendorRoutes from './modules/vendors/vendors.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);

// Future module routes mount here (inventory, invoices, payments, ...)

export default router;
