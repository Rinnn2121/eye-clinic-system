// src/pages/customer/AboutPage.js

import React from 'react';
import Footer from '../../components/Footer'; // ✅ Import the Footer

function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* HERO SECTION */}
        <section className="flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden bg-white mb-8">
          
          {/* Left Side: Text */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white z-10">
            <p className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-widest mb-3">About Us</p>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              About Vitug - Sumaya <br />
              Optical Clinic
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mb-8">
              We are a trusted optical clinic committed to providing high-quality eye care, professional guidance, and stylish eyewear for a clearer and healthier tomorrow.
            </p>
            
            {/* ✅ FB Button Link */}
            <a 
              href="https://www.facebook.com/aocopticalclinic" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[#4A90E2] text-[#4A90E2] px-6 py-2.5 rounded-md font-medium text-sm hover:bg-[#4A90E2] hover:text-white transition-colors w-fit"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Contact Us
            </a>
          </div>

          {/* Right Side: Image with Fade (Placeholder) */}
          <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100 flex items-center justify-center overflow-hidden">
            <img 
                src="/images/vslogo.png" 
                alt="Eyewear Collection"
                className="w-full h-full object-contain"
              />
            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none"></div>
          </div>
        </section>

        {/* 3 INFO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Branches */}
          <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-6 flex flex-col items-start shadow-sm">
            <div className="w-10 h-10 bg-[#e0e7ff] text-[#4A90E2] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Visit Our Branches</h3>
            <div className="text-xs text-gray-600 leading-relaxed space-y-2">
              <p>51 Poblacion-Bayan, Magsaysay, Bulacan (Beside Ganda and Infront of Blessed Hope Maternity and Lying-In Clinic)</p>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-6 flex flex-col items-start shadow-sm">
            <div className="w-10 h-10 bg-[#e0e7ff] text-[#4A90E2] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Opening Hours</h3>
            <div className="text-xs text-gray-600 leading-relaxed w-full">
              <div className="flex justify-between border-b border-gray-200 py-1.5">
                <span>Monday - Saturday</span>
                <span>8:00 AM to 6:00 PM</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Sunday</span>
                <span>8:00 AM to 5:00 PM</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-6 flex flex-col items-start shadow-sm">
            <div className="w-10 h-10 bg-[#e0e7ff] text-[#4A90E2] rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Contact Us</h3>
            <div className="text-xs text-gray-600 leading-relaxed space-y-2">
              <p className="flex items-center gap-2">📱 <strong className="font-medium text-gray-800">SMART:</strong> 0928-396-9903</p>
              <p className="flex items-center gap-2">📱 <strong className="font-medium text-gray-800">GLOBE:</strong> 0967-261-6696</p>
              <p className="flex items-center gap-2">✉️ <strong className="font-medium text-gray-800">EMAIL:</strong> opticalaoc@gmail.com</p>
              <p className="flex items-center gap-2">📘 <strong className="font-medium text-gray-800">FB PAGE:</strong> aocopticalclinic</p>
            </div>
          </div>

        </div>

      </div>

      <Footer />

    </div>
  );
}

export default AboutPage;