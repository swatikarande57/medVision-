import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';

/**
 * Wraps authenticated routes. Redirects to /login if no valid JWT token found.
 */
export const PrivateRoute: React.FC = () => {
  return authService.isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};
