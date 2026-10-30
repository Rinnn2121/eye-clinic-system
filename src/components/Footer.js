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
              <a href="https://www.facebook.com/aocopticalclinic" target="_blank" rel="noreferrer" className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm hover:text-[#4A90E2] transition-colors">f</a>
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
          <ul className="space-y-2 text-sm text-gray-700">
            <li>51 Poblacion, Maycauayan, Bulacan Philippines, 3020</li>
            <li>📞 Phone: 0928 396 9903</li>
            <li>✉️ Email: opticalclinic@gmail.com</li>
          </ul>
        </div>

      </div>
    </footer>
  );
}