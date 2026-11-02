// src/pages/customer/CustomerRegister.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function CustomerRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create Firebase Auth Account & User Role Doc
      // Note: We are passing formData to signup so AuthContext can create the customer doc too
      await signup(formData.email, formData.password, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim(),
        phone: formData.phone.trim(),
      });
      
      navigate('/customer/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to create account: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A90E2]">VITUG-SUMAYA</h1>
          <p className="text-sm text-gray-500 tracking-wider">OPTICAL CLINIC</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Create Account</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">First Name *</label>
                <input
                  type="text" name="firstName" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  value={formData.firstName} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Last Name *</label>
                <input
                  type="text" name="lastName" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  value={formData.lastName} onChange={handleChange}
                />
              </div>
            </div>

            {/* Nickname & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Nickname</label>
                <input
                  type="text" name="nickname"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  value={formData.nickname} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number *</label>
                <input
                  type="tel" name="phone" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Email *</label>
              <input
                type="email" name="email" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={formData.email} onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Password *</label>
              <input
                type="password" name="password" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={formData.password} onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password *</label>
              <input
                type="password" name="confirmPassword" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={formData.confirmPassword} onChange={handleChange}
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#4A90E2] text-white py-2.5 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-gray-100 pt-4">
            <Link to="/login" className="text-[#4A90E2] hover:underline text-sm font-medium">
              Already have an account? Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerRegister;