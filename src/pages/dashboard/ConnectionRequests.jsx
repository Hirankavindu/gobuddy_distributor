import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { requestsAPI } from '../../services/api';

export default function ConnectionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connection requests on component mount
  useEffect(() => {
    fetchConnectionRequests();
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');

      if (!userId || !accessToken) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await requestsAPI.getDistributorRequests(userId);
      setRequests(response.data);
    } catch (err) {
      console.error('Error fetching connection requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await requestsAPI.respondToRequest(requestId, 'ACCEPTED');

      // Update the request status locally with the response data
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? response.data
            : request
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Request Accepted',
        text: 'Connection request has been accepted successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error accepting request:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to accept request'
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await requestsAPI.respondToRequest(requestId, 'REJECTED');

      // Update the request status locally with the response data
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? response.data
            : request
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Request Rejected',
        text: 'Connection request has been rejected.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error rejecting request:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to reject request'
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading connection requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connection Requests</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage incoming connection requests from shops
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No connection requests</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have any pending connection requests at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Pending Requests ({requests.filter(r => r.status?.toLowerCase() === 'pending').length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Shop Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requested At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {requests.filter(r => r.status?.toLowerCase() === 'pending').map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.shopName || 'Unknown Shop'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {request.shopLocation || 'Location not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(request.requestedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status?.toLowerCase() === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {request.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                          {request.respondedAt && ` on ${formatDate(request.respondedAt)}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}