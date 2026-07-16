import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for scroll behavior
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Handle scroll - hides navbar when scrolling down, shows when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollPos > prevScrollPos && currentScrollPos > 50) {
        setVisible(false); // Scrolling down - hide navbar
      } else {
        setVisible(true); // Scrolling up - show navbar
      }
      
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prevScrollPos]);

  return (
    <nav 
      className={`bg-[#4A90E2]/40 backdrop-blur-sm shadow-md sticky top-0 z-50 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section - Left */}
          <Link to="/" className="flex items-center">
                    <img 
            src="/images/vslogo.png" 
            alt="Vitug-Sumaya Optical Clinic Logo" 
            className="h-28 w-auto object-contain"
          />
          </Link>

          {/* Navigation Links - Right */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/customer/products" 
              className="text-gray-700 hover:text-[#4A90E2] font-medium transition-colors"
            >
              Products
            </Link>
            <Link 
              to="/customer/about" 
              className="text-gray-700 hover:text-[#4A90E2] font-medium transition-colors"
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-700 hover:text-[#4A90E2] font-medium transition-colors"
            >
              Contact
            </Link>
            <Link 
              to="/services" 
              className="text-gray-700 hover:text-[#4A90E2] font-medium transition-colors"
            >
              Services
            </Link>

            {/* Divider */}
            <span className="w-px h-6 bg-gray-300"></span>

            {/* Right Section - Login/User */}
            <div className="flex items-center space-x-3">
              {currentUser ? (
                <>
                  {(userRole === 'admin' || userRole === 'staff') && (
                    <Link 
                      to="/admin/dashboard" 
                      className="text-gray-700 hover:text-[#4A90E2] transition-colors text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  <Link 
                    to="/customer/dashboard" 
                    className="text-[#4A90E2] hover:text-[#4A90E2]/70 transition-colors"
                    title="My Account"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/customer/login" 
                    className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium text-sm"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700 hover:text-[#4A90E2]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;