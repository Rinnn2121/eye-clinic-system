// src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  // ✅ Wait for role to be determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // ✅ Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/customer/login" replace />;
  }

  // ✅ Redirect if role not allowed
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;