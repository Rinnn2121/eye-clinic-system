// src/components/ProfileMenu.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function ProfileMenu({ align = 'right', direction = 'down' }) {
  const { currentUser, userRole, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const displayName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName || ''}`.trim()
    : userData?.name || currentUser?.email?.split('@')[0] || 'User';

  const displayEmail = currentUser?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  let positionClasses = '';
  if (align === 'right-sidebar') {
    positionClasses = 'left-full bottom-0 ml-2';
  } else {
    positionClasses = `right-0 ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}`;
  }

  const profileLink = userRole === 'admin' || userRole === 'staff' 
    ? '/admin/profile' 
    : '/customer/profile';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 bg-white text-gray-700 hover:text-[#1e40af] rounded-full shadow-sm transition-colors border border-gray-200 overflow-hidden"
        title="My Account"
      >
        {userData?.photoUrl ? (
          <img src={userData.photoUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-sm">{initial}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-[999] w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden ${positionClasses}`} style={{ right: align !== 'right-sidebar' ? 0 : 'auto' }}>

          {/* Profile Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#4A90E2] text-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-lg">{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide bg-[#4A90E2]/10 text-[#4A90E2] px-2 py-0.5 rounded-full">
                {userRole === 'admin' ? 'Administrator' : userRole === 'staff' ? 'Staff' : 'Customer'}
              </span>
            </div>
          </div>

          <div className="p-2">
            {/* Admin-only: Manage Accounts */}
            {userRole === 'admin' && (
              <>
                <Link
                  to="/admin/accounts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Manage Accounts
                </Link>

                <div className="border-t border-gray-100 my-1"></div>
              </>
            )}

            {/* Profile Link */}
            <Link
              to={profileLink}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLogoutModal(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out?"
        message="Are you sure you want to log out of your account?"
        iconType="warning"
        confirmText="Yes, Logout"
        confirmColor="red"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

    </div>
  );
}