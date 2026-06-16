import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import vendorRoutes from './modules/vendors/vendors.routes.js';
import productRoutes from './modules/products/products.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import purchaseRoutes from './modules/purchases/purchases.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import ledgerRoutes from './modules/ledger/ledger.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/payments', paymentRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// Future module routes mount here (users, ...)

export default router;
