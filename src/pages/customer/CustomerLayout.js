// src/pages/customer/CustomerLayout.js

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function CustomerLayout() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) => 
    `block px-6 py-3 font-bold text-[15px] transition-colors rounded-lg ${
      isActive 
        ? 'text-[#4A90E2] bg-white shadow-sm' 
        : 'text-gray-800 hover:bg-white/50'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* ✅ LEFT SIDEBAR */}
      <div className="w-full md:w-64 bg-[#dbeafe] flex-shrink-0 flex flex-col border-r border-blue-100">
        
        {/* Profile Info */}
        <div className="p-6 flex flex-col items-center border-b border-blue-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 text-lg">
            {userData?.firstName ? `${userData.firstName} ${userData.lastName}` : 'Customer Name'}
          </h2>
          <p className="text-xs text-gray-600 mt-1">{currentUser?.email}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink to="/customer/dashboard" end className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/customer/profile" className={navLinkClass}>My Profile</NavLink>
          <NavLink to="/customer/appointments" className={navLinkClass}>My Appointments</NavLink>
          <NavLink to="/customer/transactions" className={navLinkClass}>My Transactions</NavLink>
          <NavLink to="/customer/cart" className={navLinkClass}>My Cart</NavLink>
          <NavLink to="/customer/wishlist" className={navLinkClass}>My Wishlist</NavLink>
          <NavLink to="/customer/item-status" className={navLinkClass}>Item Status</NavLink>
        </nav>

        {/* Logout Button (Optional) */}
        <div className="p-4 border-t border-blue-200">
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ✅ RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Breadcrumb Area */}
        <div className="bg-white px-8 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" /></svg>
            <span>&gt;</span>
            <span className="text-gray-800 font-medium">My Account</span>
          </div>
        </div>

                {/* The actual page content will render here */}
        <div className="p-4 md:p-6 lg:p-8 flex-1 w-full">
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default CustomerLayout;