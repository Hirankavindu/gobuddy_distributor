import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../providers/useAuth';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      className="bg-gray-100 dark:bg-slate-700 rounded-lg py-2 px-4 pl-10 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Search..."
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 dark:text-gray-300 absolute left-3 top-2.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Notifications */}
                <button className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none">
                  <span className="sr-only">View notifications</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
                
                {/* Logout button */}
                <button 
                  onClick={() => onLogout()}
                  className="ml-2 p-1 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none"
                >
                  <span className="sr-only">Logout</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}