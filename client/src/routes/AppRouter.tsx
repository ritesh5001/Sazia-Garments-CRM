import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
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
          { path: '/inventory', element: <PlaceholderPage title="Inventory" phase="Phase 3" /> },
          { path: '/vendors', element: <PlaceholderPage title="Vendors" phase="Phase 2" /> },
          { path: '/customers', element: <PlaceholderPage title="Customers" phase="Phase 2" /> },
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
