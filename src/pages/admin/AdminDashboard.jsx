import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';

function AdminDashboard() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center">
            <span className="text-gray-600 dark:text-gray-300 mr-4">
              {user?.email}
            </span>
            <button
              onClick={() => {
                handleLogout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Manage all users including distributors and drivers.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View users →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Analytics</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  View system performance and analytics data.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View analytics →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Settings</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Configure system-wide settings and parameters.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;