// src/components/Footer.js

import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#b8cff2] mt-16 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Description */}
        <div>
          <img src="/images/vslogo.png" alt="Logo" className="h-16 mb-4" />
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
            Eyecare Done Redefines modern eye care with advanced, non-surgical treatments and surgery.
          </p>
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-800 mb-2">Follow Us</p>
            <div className="flex gap-2">
              {/* ✅ Facebook SVG */}
              <a href="https://www.facebook.com/aocopticalclinic" target="_blank" rel="noreferrer" className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:text-[#4A90E2] transition-colors">
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Useful Links */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Useful Links</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link to="/" className="hover:text-[#4A90E2] transition-colors">Home</Link></li>
            <li><Link to="/customer/products" className="hover:text-[#4A90E2] transition-colors">Products</Link></li>
            <li><Link to="/services" className="hover:text-[#4A90E2] transition-colors">Services</Link></li>
            <li><Link to="/customer/about" className="hover:text-[#4A90E2] transition-colors">About Us</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              {/* ✅ Map Pin SVG */}
              <svg className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>71 Provincial Rd. Banga Meycauayan Bulacan</span>
            </li>
            <li className="flex items-center gap-2">
              {/* ✅ Phone SVG */}
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Phone: 0928 396 9903</span>
            </li>
            <li className="flex items-center gap-2">
              {/* ✅ Mail SVG */}
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email: opticalclinic@gmail.com</span>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}