import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  // ✅ 1. If Firebase is still checking the session, show the spinner!
  // This prevents the "instant logout" bug.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // ✅ 2. Only redirect to login if Firebase is DONE loading and there is no user.
  if (!currentUser) {
    return <Navigate to="/customer/login" replace />;
  }

  // ✅ 3. Check roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;