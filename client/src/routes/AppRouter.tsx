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
import { PlaceholderPage } from '@/components/PlaceholderPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/invoices', element: <PlaceholderPage title="Invoices" phase="Phase 4" /> },
          { path: '/payments', element: <PlaceholderPage title="Payments" phase="Phase 6" /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/inventory/:id', element: <ProductDetailPage /> },
          { path: '/vendors', element: <VendorsPage /> },
          { path: '/vendors/:id', element: <VendorDetailPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/orders', element: <PlaceholderPage title="Orders" phase="Phase 7" /> },
          { path: '/reports', element: <PlaceholderPage title="Reports" phase="Phase 9" /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['admin']} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/users', element: <PlaceholderPage title="User Management" phase="Phase 10" /> },
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
