// src/components/Navbar.js

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
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
            <div className="hidden md:flex items-center space-x-6 h-full">
              {isAdminOrStaff ? (
                <>
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    Overview
                  </NavLink>
                  <NavLink to="/admin/appointments" className={navLinkClass}>
                    Appointments
                  </NavLink>
                  <NavLink to="/admin/customers" className={navLinkClass}>
                    Customers
                  </NavLink>
                  
                  {/* ✅ Inventory link is visible to BOTH Admin and Staff */}
                  <NavLink to="/admin/inventory" className={navLinkClass}>
                    Inventory
                  </NavLink>

                  {/* ✅ Sales link is ONLY visible to Admin */}
                  {userRole === 'admin' && (
                    <NavLink to="/admin/sales" className={navLinkClass}>
                      Sales
                    </NavLink>
                  )}
                </>
              ) : (
                <>
                  <NavLink to="/customer/products" className={navLinkClass}>Products</NavLink>
                  <NavLink to="/customer/about" className={navLinkClass}>About Us</NavLink>
                  <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
                  <NavLink to="/services" className={navLinkClass}>Services</NavLink>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (Desktop Auth) */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <>
                <span className="w-px h-6 bg-gray-400 mr-2"></span>
                <Link to={getDashboardUrl()} className="text-[#4A90E2] hover:text-[#4A90E2]/70 transition-colors p-2 bg-white/50 rounded-full" title="Go to Dashboard">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button onClick={handleLogout} className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-bold shadow-sm">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/customer/login" className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium text-sm">
                Login
              </Link>
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
            
            {/* Mobile Links */}
            {isAdminOrStaff ? (
              <>
                <NavLink to="/admin/dashboard" onClick={closeMobileMenu} className={mobileNavLinkClass}>Overview</NavLink>
                <NavLink to="/admin/appointments" onClick={closeMobileMenu} className={mobileNavLinkClass}>Appointments</NavLink>
                <NavLink to="/admin/customers" onClick={closeMobileMenu} className={mobileNavLinkClass}>Customers</NavLink>
                
                {/* ✅ Inventory for both */}
                <NavLink to="/admin/inventory" onClick={closeMobileMenu} className={mobileNavLinkClass}>Inventory</NavLink>
                
                {/* ✅ Sales only for Admin */}
                {userRole === 'admin' && (
                  <NavLink to="/admin/sales" onClick={closeMobileMenu} className={mobileNavLinkClass}>Sales</NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/customer/products" onClick={closeMobileMenu} className={mobileNavLinkClass}>Products</NavLink>
                <NavLink to="/customer/about" onClick={closeMobileMenu} className={mobileNavLinkClass}>About Us</NavLink>
                <NavLink to="/contact" onClick={closeMobileMenu} className={mobileNavLinkClass}>Contact</NavLink>
                <NavLink to="/services" onClick={closeMobileMenu} className={mobileNavLinkClass}>Services</NavLink>
              </>
            )}

            {/* Mobile Auth Buttons */}
            <div className="pt-4 flex flex-col space-y-3">
              {currentUser ? (
                <>
                  <Link to={getDashboardUrl()} onClick={closeMobileMenu} className="flex items-center justify-center bg-[#4A90E2]/10 text-[#4A90E2] px-4 py-2 rounded-lg font-medium">
                    My Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
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
  );
}

export default Navbar;