import { useState, useEffect } from 'react';

// Sample dashboard stats
const statsData = [
  { id: 1, name: 'Total Distributors', value: '124', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', change: '+12%', changeType: 'increase' },
  { id: 2, name: 'Active Drivers', value: '42', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z', change: '+4%', changeType: 'increase' },
  { id: 3, name: 'Products', value: '289', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', change: '+18', changeType: 'increase' },
  { id: 4, name: 'Pending Orders', value: '23', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', change: '-5', changeType: 'decrease' },
];

// Sample recent activity data
const recentActivityData = [
  { id: 1, type: 'order', title: 'New order #1234', description: 'Order placed for Product X', time: '5 minutes ago', status: 'pending' },
  { id: 2, type: 'distributor', title: 'Distributor onboarded', description: 'DistCo Inc. completed registration', time: '2 hours ago', status: 'success' },
  { id: 3, type: 'driver', title: 'New driver application', description: 'John Doe submitted driver application', time: '1 day ago', status: 'review' },
  { id: 4, type: 'product', title: 'Product update', description: 'Inventory updated for Product Y', time: '3 days ago', status: 'success' },
];

function StatsCard({ name, value, icon, change, changeType }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{name}</dt>
            <dd>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        <div className={`flex items-center text-sm ${
          changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          <svg
            className="flex-shrink-0 self-center h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {changeType === 'increase' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            )}
          </svg>
          <span className="ml-1">{change} from last month</span>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ type, title, description, time, status }) {
  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pending</span>;
      case 'review':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Review</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'order':
        return "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z";
      case 'distributor':
        return "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
      case 'driver':
        return "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z";
      case 'product':
        return "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4";
      default:
        return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  };

  return (
    <div className="flex items-start py-4 border-b border-gray-200 dark:border-slate-700 last:border-0">
      <div className="flex-shrink-0">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon()} />
          </svg>
        </div>
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</h3>
          <div className="ml-2">{getStatusBadge()}</div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{time}</p>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}, User</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Here's what's happening with your distribution network today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <StatsCard
            key={stat.id}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="px-6 py-4">
            {recentActivityData.map((activity) => (
              <ActivityItem
                key={activity.id}
                type={activity.type}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                status={activity.status}
              />
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
            <div className="text-sm">
              <button className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                View all activity
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <button className="flex items-center px-4 py-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Add Distributor</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Register a new distributor</p>
                </div>
              </button>
              
              <button className="flex items-center px-4 py-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Add Product</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add a new product</p>
                </div>
              </button>
              
              <button className="flex items-center px-4 py-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Create Order</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Process a new order</p>
                </div>
              </button>
              
              <button className="flex items-center px-4 py-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reports</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View analytics reports</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}