// This service handles all authentication related operations including login and token storage

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
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Login error response:', errorData);
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
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
    throw error;
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