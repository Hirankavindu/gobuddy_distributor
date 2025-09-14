import axios from 'axios';
import Swal from 'sweetalert2';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api/v1', // This will be proxied to http://localhost:8080/api/v1
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    // Handle different error status codes
    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
            confirmButtonText: 'OK'
          }).then(() => {
            // Clear local storage and redirect to login
            localStorage.clear();
            window.location.href = '/';
          });
          break;

        case 403:
          // Forbidden - insufficient permissions
          Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to perform this action.',
          });
          break;

        case 404:
          // Not found
          Swal.fire({
            icon: 'error',
            title: 'Not Found',
            text: 'The requested resource was not found.',
          });
          break;

        case 422: {
          // Validation error
          const validationErrors = data.errors || [];
          const errorMessage = validationErrors.length > 0
            ? validationErrors.join(', ')
            : data.message || 'Validation failed';

          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: errorMessage,
          });
          break;
        }

        case 500:
          // Server error
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'An internal server error occurred. Please try again later.',
          });
          break;

        default:
          // Other errors
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'An unexpected error occurred.',
          });
      }
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('timeout')) {
      // Network error or timeout
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please check your internet connection and try again.',
      });
    } else {
      // Other errors
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An unexpected error occurred.',
      });
    }

    return Promise.reject(error);
  }
);

// API methods for different resources
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

export const distributorsAPI = {
  getAll: (params) => api.get('/distributors', { params }),
  getById: (id) => api.get(`/distributors/${id}`),
  create: (distributorData) => api.post('/distributors', distributorData),
  update: (id, distributorData) => api.put(`/distributors/${id}`, distributorData),
  delete: (id) => api.delete(`/distributors/${id}`),
};

export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (driverData) => api.post('/drivers', driverData),
  update: (id, driverData) => api.put(`/drivers/${id}`, driverData),
  delete: (id) => api.delete(`/drivers/${id}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const requestsAPI = {
  getDistributorRequests: (distributorId) => api.get(`/requests/distributor/${distributorId}`),
  respondToRequest: (requestId, status) => api.put(`/requests/${requestId}/respond?status=${status}`),
  createRequest: (requestData) => api.post('/requests', requestData),
};

// Export the configured axios instance as default
export default api;