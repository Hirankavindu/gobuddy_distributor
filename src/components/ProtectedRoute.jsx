import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/authService';

// Protected route component
const ProtectedRoute = ({ allowedRoles }) => {
  const isAuth = isAuthenticated();
  const userRole = getUserRole();
  
  // If not authenticated, redirect to login
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }
  
  // If allowedRoles specified, check if user role is allowed
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "SUPER_ADMIN") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;