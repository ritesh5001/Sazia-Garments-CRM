import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import vendorRoutes from './modules/vendors/vendors.routes.js';
import productRoutes from './modules/products/products.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productRoutes);

// Future module routes mount here (invoices, purchases, payments, ...)

export default router;
