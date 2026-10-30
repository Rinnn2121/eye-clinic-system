// src/components/Navbar.js

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal'; 
import NotificationBell from './NotificationBell';

function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      if (currentScrollPos > prevScrollPos && currentScrollPos > 50) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const getDashboardUrl = () => {
    if (userRole === 'admin' || userRole === 'staff') {
      return '/admin/dashboard';
    }
    return '/customer/dashboard';
  };

  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';

  const navLinkClass = ({ isActive }) => 
    `flex items-center h-full px-2 font-medium transition-colors border-b-[3px] ${
      isActive 
        ? 'text-[#1e40af] border-[#1e40af] font-bold' 
        : 'text-gray-600 border-transparent hover:text-[#1e40af]'
    }`;

  const mobileNavLinkClass = ({ isActive }) => 
    `block w-full py-2 font-medium transition-colors border-b ${
      isActive 
        ? 'text-[#4A90E2] border-blue-100 bg-blue-50/50 px-2 rounded' 
        : 'text-gray-700 border-gray-100 hover:text-[#4A90E2] px-2'
    }`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav 
        className={`bg-[#b8cff2] backdrop-blur-sm shadow-sm sticky top-0 z-50 transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20 md:h-24">
            
            {/* LEFT SIDE */}
            <div className="flex items-center gap-6 h-full">
              <Link to={isAdminOrStaff ? "/admin/dashboard" : "/"} onClick={closeMobileMenu} className="flex items-center h-full">
                <img 
                  src="/images/vslogo.png" 
                  alt="Vitug-Sumaya Optical Clinic Logo" 
                  className="h-16 md:h-20 w-auto object-contain py-2" 
                />
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-4 h-full">
                {isAdminOrStaff ? (
                  <>
                    <NavLink to="/admin/dashboard" className={navLinkClass}>Overview</NavLink>
                    <NavLink to="/admin/appointments" className={navLinkClass}>Appointments</NavLink>
                    <NavLink to="/admin/customers" className={navLinkClass}>Customers</NavLink>
                    <NavLink to="/admin/inventory" className={navLinkClass}>Inventory</NavLink>
                    {userRole === 'admin' && (
                      <NavLink to="/admin/sales" className={navLinkClass}>Sales</NavLink>
                    )}
                    {/* ✅ Reports Link Added Here */}
                    {userRole === 'admin' && (
                      <NavLink to="/admin/reports" className={navLinkClass}>Reports</NavLink>
                    )}
                  </>
                ) : (
                  <>
                    <NavLink to="/" className={navLinkClass} end>Home</NavLink>
                    <NavLink to="/customer/products" className={navLinkClass}>Products</NavLink>
                    <NavLink to="/services" className={navLinkClass}>Services</NavLink>
                    <NavLink to="/customer/about" className={navLinkClass}>About Us</NavLink>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SIDE (Desktop Auth) */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser ? (
                <>
                  {/* ✅ Add Notification Bell Here */}
                  <NotificationBell />

                  <span className="w-px h-6 bg-gray-400 mx-1"></span>
                  {!isAdminOrStaff && (
                    <div className="flex items-center gap-4 mr-2">
                      <Link to="/customer/wishlist" className="text-gray-700 hover:text-[#1e40af] transition-colors" title="Favorites">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </Link>
                      <Link to="/customer/cart" className="text-gray-700 hover:text-[#1e40af] transition-colors" title="Cart">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </Link>
                      <Link to={getDashboardUrl()} className="bg-white text-gray-700 hover:text-[#1e40af] w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors" title="My Account">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </Link>
                    </div>
                  )}

                  {isAdminOrStaff && (
                    <Link to={getDashboardUrl()} className="text-[#4A90E2] hover:text-[#4A90E2]/70 transition-colors p-2 bg-white/50 rounded-full" title="Dashboard">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </Link>
                  )}

                  <span className="w-px h-6 bg-gray-400 mx-1"></span>
                  
                  <button 
                    onClick={() => setShowLogoutModal(true)} 
                    className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-bold shadow-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mr-2">
                    <Link to="/customer/wishlist" className="text-gray-700 hover:text-[#1e40af] transition-colors" title="Favorites">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </Link>
                    <Link to="/customer/cart" className="text-gray-700 hover:text-[#1e40af] transition-colors" title="Cart">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </Link>
                    <Link to="/customer/login" className="bg-white text-gray-700 hover:text-[#1e40af] w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors" title="Login">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </Link>
                  </div>

                  <Link to="/customer/login" className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium text-sm">
                    Login
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-700 hover:text-[#4A90E2] p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 absolute w-full shadow-lg">
            <div className="flex flex-col px-4 pt-2 pb-6 space-y-2">
              
              {isAdminOrStaff ? (
                <>
                  <NavLink to="/admin/dashboard" onClick={closeMobileMenu} className={mobileNavLinkClass}>Overview</NavLink>
                  <NavLink to="/admin/appointments" onClick={closeMobileMenu} className={mobileNavLinkClass}>Appointments</NavLink>
                  <NavLink to="/admin/customers" onClick={closeMobileMenu} className={mobileNavLinkClass}>Customers</NavLink>
                  <NavLink to="/admin/inventory" onClick={closeMobileMenu} className={mobileNavLinkClass}>Inventory</NavLink>
                  {userRole === 'admin' && (
                    <NavLink to="/admin/sales" onClick={closeMobileMenu} className={mobileNavLinkClass}>Sales</NavLink>
                  )}
                  {/* ✅ Mobile Reports Link */}
                  {userRole === 'admin' && (
                    <NavLink to="/admin/reports" onClick={closeMobileMenu} className={mobileNavLinkClass}>Reports</NavLink>
                  )}
                </>
              ) : (
                <>
                  <NavLink to="/" onClick={closeMobileMenu} className={mobileNavLinkClass} end>Home</NavLink>
                  <NavLink to="/customer/products" onClick={closeMobileMenu} className={mobileNavLinkClass}>Products</NavLink>
                  <NavLink to="/services" onClick={closeMobileMenu} className={mobileNavLinkClass}>Services</NavLink>
                  <NavLink to="/customer/about" onClick={closeMobileMenu} className={mobileNavLinkClass}>About Us</NavLink>
                </>
              )}

              <div className="pt-4 flex flex-col space-y-3 border-t border-gray-200 mt-2">
                {currentUser ? (
                  <>
                    <Link to={getDashboardUrl()} onClick={closeMobileMenu} className="flex items-center justify-center bg-[#4A90E2]/10 text-[#4A90E2] px-4 py-2 rounded-lg font-medium">
                      My Dashboard
                    </Link>
                    <button 
                      onClick={() => { setShowLogoutModal(true); closeMobileMenu(); }} 
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/customer/login" onClick={closeMobileMenu} className="bg-[#4A90E2] text-center text-white px-5 py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ✅ LOGOUT CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out?"
        message="Are you sure you want to log out of your account?"
        icon={
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        }
        confirmText="Yes, Logout"
        confirmColor="red"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default Navbar;