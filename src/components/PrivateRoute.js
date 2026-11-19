import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ✅ MODULE-LEVEL VARIABLE - Survives across all re-renders
let globalKnownRole = localStorage.getItem('userRoleCache');

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // ✅ Update global role whenever we see it
  if (userRole) {
    globalKnownRole = userRole;
  }

  // ✅ If loading but we have a known role, DO NOT show spinner (avoids flash)
  if (loading && !globalKnownRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // ✅ Use global role as the source of truth
  const effectiveRole = userRole || globalKnownRole;

  // Not logged in
  if (!currentUser && !effectiveRole) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role check
  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    if (effectiveRole === 'admin' || effectiveRole === 'staff') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;