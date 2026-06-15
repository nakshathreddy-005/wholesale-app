import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
