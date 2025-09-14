import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ordersAPI } from '../../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Assign delivery modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [deliveryPersonsLoading, setDeliveryPersonsLoading] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get userId from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const response = await ordersAPI.getByDistributor(userId);
      setOrders(response.data.content || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load orders. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle order status update (accept/reject)
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const actionText = newStatus === 'CONFIRMED' ? 'accept' : 'reject';
    const confirmText = `Are you sure you want to ${actionText} this order?`;

    const result = await Swal.fire({
      title: 'Confirm Action',
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'CONFIRMED' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: newStatus === 'CONFIRMED' ? 'Accept Order' : 'Reject Order',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        if (newStatus === 'CONFIRMED') {
          // Use the new confirm endpoint for accepting orders
          console.log('Making confirm request for order:', orderId);
          const response = await ordersAPI.confirm(orderId);
          console.log('Confirm response:', response);
        } else {
          // Use the existing updateStatus endpoint for rejecting orders
          console.log('Making reject request for order:', orderId);
          await ordersAPI.updateStatus(orderId, newStatus);
        }

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Order has been ${actionText}ed successfully.`,
          timer: 2000,
          showConfirmButton: false
        });

        // Refresh orders list
        fetchOrders();
      } catch (error) {
        console.error('Error updating order status:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${actionText} order. Please try again.`,
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  // Handle assign delivery
  const handleAssignDelivery = async (orderId) => {
    setSelectedOrderId(orderId);
    setAssignModalOpen(true);
    setSelectedDeliveryPerson('');
    await fetchDeliveryPersons(orderId, true); // Default to onlyActive=true
  };

  // Fetch delivery persons for the order
  const fetchDeliveryPersons = async (orderId, activeOnly) => {
    setDeliveryPersonsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Please log in again.',
        });
        return;
      }

      const response = await fetch(`/api/v1/delivery/${orderId}/delivery-persons?onlyActive=${activeOnly}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setDeliveryPersons(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch delivery persons');
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
      setDeliveryPersons([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load delivery persons. Please try again.',
      });
    } finally {
      setDeliveryPersonsLoading(false);
    }
  };

  // Handle only active toggle change
  const handleOnlyActiveToggle = async (isActive) => {
    setOnlyActive(isActive);
    if (selectedOrderId) {
      await fetchDeliveryPersons(selectedOrderId, isActive);
    }
  };

  // Handle assign delivery driver
  const handleAssignDriver = async () => {
    if (!selectedDeliveryPerson) {
      Swal.fire({
        icon: 'warning',
        title: 'No Driver Selected',
        text: 'Please select a delivery driver.',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Please log in again.',
        });
        return;
      }

      // Here you would make the API call to assign the driver
      // For now, just show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Delivery driver assigned successfully!',
        timer: 2000,
        showConfirmButton: false
      });

      // Close modal and refresh orders
      setAssignModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error assigning driver:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to assign delivery driver. Please try again.',
      });
    }
  };

  // Close assign modal
  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedOrderId(null);
    setDeliveryPersons([]);
    setSelectedDeliveryPerson('');
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.shopId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Status badges
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'created':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Created</span>;
      case 'confirmed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Confirmed</span>;
      case 'cancelled':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Cancelled</span>;
      case 'in_transit':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">In Transit</span>;
      case 'delivered':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Delivered</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">{status || 'Unknown'}</span>;
    }
  };

  // Payment status badges
  const getPaymentStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pending</span>;
      case 'paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Paid</span>;
      case 'failed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Failed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">{status || 'Unknown'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Orders</div>
          <div className="text-gray-600 dark:text-gray-300">{error}</div>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and view all orders from your distributors
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Orders</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'CONFIRMED').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Confirmed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'CREATED').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            ${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders by ID or Shop ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="created">Created</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Shop: {order.shopId.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.deliveryAddress?.address1 || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.deliveryAddress?.city}, {order.deliveryAddress?.province}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.paymentMethod} • {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                Qty: {item.quantity} × ${item.unitPrice}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${order.total?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        +${order.deliveryFee?.toFixed(2)} delivery
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {order.status === 'CREATED' && (
                        <>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id, 'CONFIRMED')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(order.status === 'CONFIRMED' || order.status === 'IN_TRANSIT') && (
                        <button
                          onClick={() => handleAssignDelivery(order.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Assign Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Delivery Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Delivery Driver
              </h3>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Only Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show only active drivers
                </label>
                <button
                  onClick={() => handleOnlyActiveToggle(!onlyActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    onlyActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      onlyActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Delivery Person Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Delivery Driver
                </label>
                {deliveryPersonsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <select
                    value={selectedDeliveryPerson}
                    onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Choose a delivery driver...</option>
                    {deliveryPersons.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.deliveryPersonName} - {person.vehicleType} ({person.vehicleNumber}) - {person.deliveryArea}
                      </option>
                    ))}
                  </select>
                )}
                {deliveryPersons.length === 0 && !deliveryPersonsLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No delivery drivers available for this order.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={!selectedDeliveryPerson || deliveryPersonsLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Delivery Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}