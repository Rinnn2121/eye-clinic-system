import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // ✅ Blank page while auth is loading (no navbar/sidebar flash)
  if (loading) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        isExpanded={isExpanded} 
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className={`md:pl-20 transition-all duration-300`}>
        <main className="p-4 md:p-6 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}