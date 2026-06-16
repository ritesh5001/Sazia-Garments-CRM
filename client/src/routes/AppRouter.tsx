import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { CustomerDetailPage } from '@/features/customers/CustomerDetailPage';
import { VendorsPage } from '@/features/vendors/VendorsPage';
import { VendorDetailPage } from '@/features/vendors/VendorDetailPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { ProductDetailPage } from '@/features/inventory/ProductDetailPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { InvoiceFormPage } from '@/features/invoices/InvoiceFormPage';
import { InvoiceDetailPage } from '@/features/invoices/InvoiceDetailPage';
import { PurchasesPage } from '@/features/purchases/PurchasesPage';
import { PurchaseFormPage } from '@/features/purchases/PurchaseFormPage';
import { PurchaseDetailPage } from '@/features/purchases/PurchaseDetailPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { OrdersPage } from '@/features/orders/OrdersPage';
import { OrderFormPage } from '@/features/orders/OrderFormPage';
import { OrderDetailPage } from '@/features/orders/OrderDetailPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { ActivityLogsPage } from '@/features/logs/ActivityLogsPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/invoices', element: <InvoicesPage /> },
          { path: '/invoices/new', element: <InvoiceFormPage /> },
          { path: '/invoices/:id', element: <InvoiceDetailPage /> },
          { path: '/invoices/:id/edit', element: <InvoiceFormPage /> },
          { path: '/purchases', element: <PurchasesPage /> },
          { path: '/purchases/new', element: <PurchaseFormPage /> },
          { path: '/purchases/:id', element: <PurchaseDetailPage /> },
          { path: '/purchases/:id/edit', element: <PurchaseFormPage /> },
          { path: '/payments', element: <PaymentsPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/inventory/:id', element: <ProductDetailPage /> },
          { path: '/vendors', element: <VendorsPage /> },
          { path: '/vendors/:id', element: <VendorDetailPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/orders', element: <OrdersPage /> },
          { path: '/orders/new', element: <OrderFormPage /> },
          { path: '/orders/:id', element: <OrderDetailPage /> },
          { path: '/orders/:id/edit', element: <OrderFormPage /> },
          { path: '/reports', element: <ReportsPage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['admin']} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/users', element: <UsersPage /> },
              { path: '/logs', element: <ActivityLogsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
