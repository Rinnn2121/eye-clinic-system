// src/components/RootRedirect.js

import React, { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/customer/LandingPage';

export default function RootRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!loading) hasLoadedOnce.current = true;
  }, [loading]);

  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // ✅ Admins/Staff never see the landing page
  if (currentUser && (userRole === 'admin' || userRole === 'staff')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <LandingPage />;
}