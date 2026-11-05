// src/components/AdminSidebar.js

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu'; 

export default function AdminSidebar({ isExpanded, onToggleExpand, isMobileOpen, onMobileClose }) {
  // ✅ Grab user data to display the name
  const { userRole, userData, currentUser } = useAuth();
  const isAdmin = userRole === 'admin';

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 w-full rounded-xl transition-all duration-200 ${
      isExpanded ? 'px-4 py-3 justify-start' : 'p-3 justify-center'
    } ${
      isActive
        ? 'bg-white text-[#1e40af] font-bold shadow-sm'
        : 'text-gray-800 hover:bg-white/50'
    }`;

  const SidebarContent = ({ isMobile = false }) => {
    const expanded = isMobile ? true : isExpanded;

    // ✅ Format user's display name
    const displayName = userData?.name || userData?.firstName || currentUser?.email?.split('@')[0] || 'Admin Staff';
    const displayRole = userRole === 'admin' ? 'Administrator' : 'Staff';

    return (
      <div className="flex flex-col h-full bg-[#b8cff2] text-gray-800 border-r border-blue-200">
        
        {/* Top Section: Hamburger + Logo */}
        <div className={`flex items-center h-16 border-b border-blue-200 flex-shrink-0 ${expanded ? 'px-4 justify-between' : 'justify-center'}`}>
          
          {!isMobile && (
            <button
              onClick={onToggleExpand}
              className="p-2 text-gray-700 hover:text-[#1e40af] hover:bg-white/50 rounded-lg transition-colors"
              aria-label={expanded ? "Collapse menu" : "Expand menu"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {(expanded || isMobile) && (
            <Link to="/admin/dashboard" onClick={handleNavClick} className="flex-1 flex justify-center">
              <img src="/images/vslogo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </Link>
          )}

          {isMobile && (
            <button onClick={onMobileClose} className="p-2 text-gray-700 hover:text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          
          <NavLink to="/admin/dashboard" onClick={handleNavClick} className={linkClass} title="Overview">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Overview</span>
          </NavLink>

          <NavLink to="/admin/appointments" onClick={handleNavClick} className={linkClass} title="Appointments">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Appointments</span>
          </NavLink>

          <NavLink to="/admin/customers" onClick={handleNavClick} className={linkClass} title="Customers">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Customers</span>
          </NavLink>

          <NavLink to="/admin/lab-orders" onClick={handleNavClick} className={linkClass} title="Lab Orders">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Lab Orders</span>
          </NavLink>

          <NavLink to="/admin/catalog" onClick={handleNavClick} className={linkClass} title="Catalog">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Catalog</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin/sales" onClick={handleNavClick} className={linkClass} title="Sales">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 16V8h4a3 3 0 0 1 0 6H9m-1-3h6m-6 3h6" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Sales</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/reports" onClick={handleNavClick} className={linkClass} title="Reports">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Reports</span>
            </NavLink>
          )}
        </nav>

        {/* ✅ Notification Bell Row */}
        <div className="px-2 py-2">
          <NotificationBell align="sidebar" isExpanded={expanded} />
        </div>

        {/* ✅ Bottom Section: Profile Info & Menu */}
        <div className="border-t border-blue-200 flex-shrink-0 p-3">
          <div className={`flex items-center gap-3 ${expanded ? 'justify-start' : 'justify-center'}`}>
            
            {/* Profile Picture (Trigger for Dropdown) */}
            <ProfileMenu showManageAccounts align="right-sidebar" />
            
            {/* Profile Name & Role (Only shows when expanded) */}
            {expanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {displayName}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                  {displayRole}
                </span>
              </div>
            )}

          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      <aside
        onClick={(e) => e.stopPropagation()} 
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 shadow-lg transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent isMobile={false} />
      </aside>

      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        onClick={(e) => e.stopPropagation()} 
        className={`md:hidden fixed inset-y-0 left-0 w-64 max-w-[80vw] z-50 transform transition-transform duration-300 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isMobile={true} />
      </aside>
    </>
  );
}