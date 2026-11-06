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
      
      <AdminSidebar 
        isExpanded={isExpanded} 
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* ✅ MOBILE HAMBURGER BUTTON */}
      {/* This only shows on mobile (md:hidden) and sits fixed at the top-left */}
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="bg-white text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Main Content Area — Overlaps with the sidebar when it opens */}
      <div 
        className="md:pl-20" // Permanent padding for the collapsed sidebar on desktop
        onClick={handleMainContentClick}
      >
        {/* Added pt-16 on mobile so the content doesn't hide under the new hamburger button */}
        <main className="p-4 md:p-6 lg:p-8 pt-16 md:pt-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}