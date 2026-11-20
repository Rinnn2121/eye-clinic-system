// src/pages/customer/CustomerRegister.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

function CustomerRegister() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', nickname: '', phone: '', email: '', password: '', confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // ✅ New state for the eye icon
  const [showPassword, setShowPassword] = useState(false);
  
  const { signup } = useAuth(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.phone.length !== 11) {
      return setError('Phone number must be exactly 11 digits.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setError('');
    setLoading(true);

    try {
      await signup(formData.email, formData.password, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim(),
        phone: formData.phone.trim(),
      });
      
      // Show success modal
      setShowSuccessModal(true);

    } catch (err) {
      console.error(err);
      setError('Failed to create account: ' + err.message);
    }
    setLoading(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate('/login'); // ✅ Redirect here
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* ✅ Updated Logo Section */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/images/vslogo.png" alt="Vitug-Sumaya Optical Clinic" className="h-20 w-auto object-contain mb-2" />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Create Account</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">First Name *</label>
                <input type="text" name="firstName" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none" value={formData.firstName} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Last Name *</label>
                <input type="text" name="lastName" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Nickname</label>
                <input type="text" name="nickname" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none" value={formData.nickname} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number *</label>
                <input type="tel" name="phone" required maxLength={11} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none" placeholder="09XXXXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Email *</label>
              <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none" value={formData.email} onChange={handleChange} />
            </div>

            {/* ✅ Password Field with Eye Icon */}
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none pr-10" 
                  value={formData.password} 
                  onChange={handleChange} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#4A90E2] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ✅ Confirm Password Field with Eye Icon */}
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none pr-10" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#4A90E2] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#4A90E2] text-white py-2.5 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium disabled:opacity-50 mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-gray-100 pt-4">
            <Link to="/login" className="text-[#4A90E2] hover:underline text-sm font-medium">Already have an account? Login</Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSuccessModal}
        title="Account Created!"
        message="Your account has been successfully created. Please check your email inbox (and spam folder) to verify your email before logging in."
        iconType="success"
        confirmText="Go to Login"
        confirmColor="green"
        isAlert
        onConfirm={handleCloseSuccess}
      />
    </div>
  );
}

export default CustomerRegister;