import { createContext, useState, useEffect } from 'react';
import { isAuthenticated, getUserInfo, logout } from '../services/authService';

// Create the authentication context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    if (isAuthenticated()) {
      setUser(getUserInfo());
    }
    setLoading(false);
  }, []);

  // Update user state after successful login
  const handleLogin = (userData) => {
    setUser({
      userId: userData.userId,
      email: userData.email,
      role: userData.role
    });
  };

  // Clear user state on logout
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    handleLogin,
    handleLogout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;