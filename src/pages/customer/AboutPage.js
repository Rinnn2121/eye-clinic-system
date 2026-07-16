import React from 'react';
import { Link } from 'react-router-dom';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ℹ️ About Us</h1>
          <Link to="/customer/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            To provide exceptional eye care services and high-quality eyewear 
            to our community, ensuring every patient leaves with clearer vision 
            and a smile.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-green-500 text-xl">✓</span>
              <span>Comprehensive Eye Examinations</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-green-500 text-xl">✓</span>
              <span>Prescription Eyeglasses & Contact Lenses</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-green-500 text-xl">✓</span>
              <span>Pediatric Eye Care</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <span className="text-green-500 text-xl">✓</span>
              <span>Treatment for Eye Diseases</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <div className="space-y-3 text-gray-600">
            <p className="flex items-center gap-3">📍 123 Eye Care Street, Metro Manila</p>
            <p className="flex items-center gap-3">📞 (02) 8123-4567</p>
            <p className="flex items-center gap-3">📧 info@eyeclinic.com</p>
            <p className="flex items-center gap-3">🕐 Mon-Sat: 8:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;