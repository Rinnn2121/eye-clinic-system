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

  // Close desktop sidebar when clicking outside (on the main content)
  const handleMainContentClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ✅ Wrapped the sidebar in a div that STOPS the click from bubbling to the main content */}
      <div onClick={(e) => e.stopPropagation()}>
        <AdminSidebar 
          isExpanded={isExpanded} 
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main Content Area — Overlaps with the sidebar when it opens */}
      <div 
        className="md:pl-20" 
        onClick={handleMainContentClick}
      >
        <main className="p-4 md:p-6 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}