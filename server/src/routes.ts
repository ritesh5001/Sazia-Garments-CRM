import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import vendorRoutes from './modules/vendors/vendors.routes.js';
import productRoutes from './modules/products/products.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import purchaseRoutes from './modules/purchases/purchases.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/purchases', purchaseRoutes);

// Future module routes mount here (payments, orders, ...)

export default router;
