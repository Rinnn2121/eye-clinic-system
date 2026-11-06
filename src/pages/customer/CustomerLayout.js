// src/pages/customer/CustomerLayout.js

import React from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function CustomerLayout() {
  // ✅ Removed 'logout' from here since the button is gone
  const { currentUser, userData, resendVerification } = useAuth(); 
  const location = useLocation();

  const navLinkClass = ({ isActive }) => 
    `block px-6 py-3 font-bold text-[15px] transition-colors rounded-lg ${
      isActive 
        ? 'text-[#4A90E2] bg-white shadow-sm' 
        : 'text-gray-800 hover:bg-white/50'
    }`;

  const isCartTab = location.pathname === '/customer/cart' || location.pathname === '/customer/item-status';

  // ✅ Dynamic Breadcrumb Logic
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('profile')) return 'Profile';
    if (path.includes('appointments')) return 'Appointments';
    if (path.includes('transactions')) return 'Transactions';
    if (path.includes('cart')) return 'Cart';
    if (path.includes('item-status')) return 'Item Status';
    if (path.includes('wishlist')) return 'Wishlist';
    return 'My Account';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* ✅ LEFT SIDEBAR */}
      <div className="w-full md:w-64 bg-[#dbeafe] flex-shrink-0 flex flex-col border-r border-blue-100">
        
        {/* Profile Info */}
        <div className="p-6 flex flex-col items-center border-b border-blue-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 overflow-hidden border-2 border-white">
            {userData?.photoUrl ? (
              <img src={userData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <h2 className="font-bold text-gray-900 text-lg text-center truncate w-full">
            {userData?.name || 
             (userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : null) || 
             currentUser?.email?.split('@')[0] || 
             'Customer Name'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 truncate w-full text-center">{currentUser?.email}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink to="/customer/dashboard" end className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/customer/profile" className={navLinkClass}>Profile</NavLink>
          <NavLink to="/customer/appointments" className={navLinkClass}>Appointments</NavLink>
          <NavLink to="/customer/transactions" className={navLinkClass}>Transactions</NavLink>
          <NavLink to="/customer/cart" className={navLinkClass}>Cart</NavLink>

          {/* Sub-tabs for Cart (Item Status) */}
          {isCartTab && (
            <div className="pl-6 space-y-1 mt-1">
              <NavLink 
                to="/customer/item-status" 
                className={({ isActive }) => 
                  `block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-[#4A90E2] bg-white/60' : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                  }`
                }
              >
                Item Status
              </NavLink>
            </div>
          )}

          <NavLink to="/customer/wishlist" className={navLinkClass}>Wishlist</NavLink>
        </nav>

        {/* ✅ The Logout Button section has been completely removed from here */}

      </div>

      {/* ✅ RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* ✅ VERIFICATION BANNER (Now inside the content area) */}
        {!currentUser?.emailVerified && (
          <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold">Your email is not verified.</p>
                <p className="text-xs">Please check your inbox for a verification link.</p>
              </div>
            </div>
            <button 
              onClick={() => resendVerification()}
              className="text-xs font-bold bg-white border border-yellow-300 text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors flex-shrink-0"
            >
              Resend Email
            </button>
          </div>
        )}
        
        {/* Dynamic Top Breadcrumb Area */}
        <div className="bg-white px-8 py-4 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/customer/dashboard" className="hover:text-[#4A90E2] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" />
            </svg>
          </Link>
          <span>&gt;</span>
          {/* ✅ Dynamic Page Name */}
          <span className="text-gray-800 font-medium">{getBreadcrumb()}</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8 flex-1 w-full"> 
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default CustomerLayout;