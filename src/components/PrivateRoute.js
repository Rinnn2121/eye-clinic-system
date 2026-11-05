// src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  if (!currentUser) {
    // Not logged in? Go to login
    return <Navigate to="/login" replace />;
  }

  // ✅ Check if the user's role is allowed on this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    
    // If an admin or staff tries to access a customer route, send them to the admin dashboard
    if (userRole === 'admin' || userRole === 'staff') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // If a customer tries to access an admin route, send them to the customer dashboard
    if (userRole === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }

    // Fallback
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;