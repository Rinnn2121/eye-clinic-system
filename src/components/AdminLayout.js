// src/components/AdminLayout.js

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const location = useLocation();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Sidebar (Contains notification bell at bottom) */}
      <AdminSidebar 
        isExpanded={isExpanded} 
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area — No Top Bar */}
      <div className="md:pl-20">
        <main className="p-4 md:p-6 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}