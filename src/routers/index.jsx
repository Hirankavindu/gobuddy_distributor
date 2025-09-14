import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import DashboardHome from '../pages/dashboard/DashboardHome';
import Distributors from '../pages/dashboard/Distributors';
import Drivers from '../pages/dashboard/Drivers';
import Products from '../pages/dashboard/Products';
import Orders from '../pages/dashboard/Orders';
import ConnectionRequests from '../pages/dashboard/ConnectionRequests';
import SignIn from '../pages/signin';
import PlaceholderPage from '../components/PlaceholderPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <SignIn />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={["DISTRIBUTOR"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
          {
            path: 'distributors',
            element: <Distributors />,
          },
          {
            path: 'drivers',
            element: <Drivers />,
          },
          {
            path: 'products',
            element: <Products />,
          },
          {
            path: 'connection-requests',
            element: <ConnectionRequests />,
          },
          {
            path: 'orders',
            element: <Orders />,
          },
          {
            path: 'settings',
            element: <PlaceholderPage title="Settings" />,
          },
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      }
    ]
  },
  {
    path: '*',
    element: <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">404 - Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-300">The page you are looking for does not exist.</p>
    </div>,
  }
]);

export default router;