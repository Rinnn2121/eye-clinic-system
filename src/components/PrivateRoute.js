// src/components/PrivateRoute.js

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ✅ Bug 5 Fix: Use sessionStorage so it clears on logout and browser close
let globalKnownRole = sessionStorage.getItem('activeRole');

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // Save role when seen
  if (userRole) {
    globalKnownRole = userRole;
    sessionStorage.setItem('activeRole', userRole);
  }

  // ✅ Bug 5 Fix: Clear immediately when user logs out
  if (!currentUser && !loading) {
    globalKnownRole = null;
    sessionStorage.removeItem('activeRole');
  }

  if (loading && !globalKnownRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  const effectiveRole = userRole || globalKnownRole;

  if (!currentUser && !effectiveRole) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Bug 2 Fix: ONLY enforce verification for customers
  if (currentUser && !currentUser.emailVerified && effectiveRole === 'customer') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    if (effectiveRole === 'admin' || effectiveRole === 'staff') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;