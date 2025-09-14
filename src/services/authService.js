// This service handles all authentication related operations including login and token storage
import axios from 'axios';

/**
 * Handles user login
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise} - Response object with user data and tokens
 */
export const login = async (email, password) => {
  try {
    // Use proxied URL to avoid CORS issues
    const apiUrl = '/api/v1/auth/login';

    console.log('Attempting to login with:', { email, apiUrl });

    const response = await axios.post(apiUrl, { email, password });

    console.log('Login response status:', response.status);

    const data = response.data;

    console.log('Login successful, received data:', data);
    
    // Save tokens and user info to local storage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('email', data.email);
    localStorage.setItem('role', data.role);
    
    return data;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

/**
 * Logs the user out by removing stored tokens
 */
export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
};

/**
 * Checks if user is authenticated
 * @returns {boolean} - True if user has an access token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

/**
 * Gets the current user's role
 * @returns {string|null} - User role or null if not logged in
 */
export const getUserRole = () => {
  return localStorage.getItem('role');
};

/**
 * Gets the user information
 * @returns {object} - Object containing user information
 */
export const getUserInfo = () => {
  return {
    userId: localStorage.getItem('userId'),
    email: localStorage.getItem('email'),
    role: localStorage.getItem('role')
  };
};

/**
 * Fetches all distributors from the API
 * @returns {Promise} - Response object with distributors data
 */
export const fetchDistributors = async () => {
  try {
    // Get the access token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Use proxied URL to avoid CORS issues
    const apiUrl = '/api/v1/distributor/all';
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching distributors:", error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch distributors';
    throw new Error(errorMessage);
  }
};

/**
 * Registers a new distributor
 * @param {object} distributorData - Distributor registration data
 * @returns {Promise} - Response object with registration result
 */
export const registerDistributor = async (distributorData) => {
  try {
    // Use proxied URL to avoid CORS issues
    const apiUrl = '/api/v1/auth/register/distributor';
    
    console.log('Attempting to register distributor with:', { email: distributorData.email });
    
    // Get the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    
    // Log the token being used (first 10 chars for security)
    console.log('Using token (first 10 chars):', accessToken ? accessToken.substring(0, 10) + '...' : 'No token');
    
    // Log the full payload structure (without sensitive data) for debugging
    console.log('Request payload structure:', {
      ...distributorData,
      password: '[REDACTED]',
      profileImage: distributorData.profileImage ? '[BASE64_DATA]' : null,
      distributorImageUrl: distributorData.distributorImageUrl ? '[BASE64_DATA]' : null
    });
    
    // Handle specific fields according to backend requirements
    
    // Convert deliveryDates to an array if it's a string
    if (typeof distributorData.deliveryDates === 'string' && distributorData.deliveryDates) {
      distributorData.deliveryDates = distributorData.deliveryDates.split(',').map(day => day.trim());
    } else if (!distributorData.deliveryDates) {
      distributorData.deliveryDates = [];
    }
    
    // Keep socialMediaLinks as a string
    if (Array.isArray(distributorData.socialMediaLinks)) {
      distributorData.socialMediaLinks = distributorData.socialMediaLinks.join(',');
    }
    
    // Final check of data format
    const finalPayload = { ...distributorData };
    
    // Ensure specific formats based on backend requirements
    finalPayload.socialMediaLinks = String(finalPayload.socialMediaLinks || '');
    // deliveryDates must be an array for the backend
    if (!Array.isArray(finalPayload.deliveryDates)) {
      finalPayload.deliveryDates = finalPayload.deliveryDates ? 
        finalPayload.deliveryDates.split(',').map(day => day.trim()) : [];
    }
    finalPayload.workingDays = String(finalPayload.workingDays || '');
    finalPayload.openingTimes = String(finalPayload.openingTimes || '');
    
    // Log the final payload JSON
    console.log('Final JSON payload:', JSON.stringify(finalPayload));
    
    const response = await axios.post(apiUrl, finalPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}` // Admin token for authorization
      }
    });

    console.log('Registration response status:', response.status);
    
    const data = response.data;
    console.log('Registration successful:', data);
    
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    
    // Special handling based on status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          throw new Error('Invalid data provided. Please check your form and try again.');
        case 401:
          throw new Error('Authentication failed. Please log in again.');
        case 403:
          throw new Error('Authorization failed. Please ensure you have admin privileges and are properly logged in.');
        case 409:
          throw new Error('A distributor with this email or phone already exists.');
        case 500:
          throw new Error('Server error. Please try again later or contact support.');
        default:
          throw new Error(errorMessage);
      }
    }
    
    throw new Error(errorMessage);
  }
};