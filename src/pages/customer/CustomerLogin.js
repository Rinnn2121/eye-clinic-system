// src/pages/customer/CustomerLogin.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';        
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';                  
import { signOut, sendPasswordResetEmail } from 'firebase/auth'; 
import { auth } from '../../firebase/config'; 
import emailjs from '@emailjs/browser';

function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ State for Forgot Password
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  const [resetting, setResetting] = useState(false);

  const { login } = useAuth(); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // Strict Check: Block if not verified
      if (!user.emailVerified) {
        await signOut(auth);
        setError('Your email is not verified. Please check your inbox and click the verification link before logging in.');
        setLoading(false);
        return; 
      }

      // Send Login Notification Email (Using EmailJS)
      try {
        await emailjs.send(
          'service_qd6q6ox',      
          'template_agxoowy',     
          {
            to_email: email,
            login_time: new Date().toLocaleString('en-PH', { 
              dateStyle: 'long', 
              timeStyle: 'short' 
            }),
          },
          'EnPJnnKQXm7ASqkp9'       
        );
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr);
      }

      // Redirect based on role
      const userDoc = await getDoc(doc(db, 'users', email));
      let role = 'customer';
      if (userDoc.exists()) {
        role = userDoc.data().role || 'customer';
      }
      
      if (role === 'admin' || role === 'staff') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
      
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  // ✅ Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setResetting(true);
    setResetMessage({ type: '', text: '' });

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage({ 
        type: 'success', 
        text: 'Password reset link sent! Please check your inbox (and spam folder).' 
      });
    } catch (err) {
      console.error(err);
      setResetMessage({ 
        type: 'error', 
        text: 'Failed to send reset email. Please make sure the email is registered.' 
      });
    }
    setResetting(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo Section */}
        <div className="text-center mb-8 flex justify-center">
          <img 
            src="/images/vslogo.png" 
            alt="Vitug-Sumaya Optical Clinic" 
            className="h-24 w-auto object-contain" 
          />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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
              
              {/* ✅ Moved Forgot Password here */}
              <div className="flex justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-[#4A90E2] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A90E2] text-white py-2.5 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 mb-2">Don't have an account?</p>
            <Link to="/customer/register" className="text-[#4A90E2] hover:underline text-sm font-bold">
              Create a Customer Account
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter your registered email address. We'll send you a link to reset your password.
            </p>

            {resetMessage.text && (
              <div className={`p-3 rounded mb-4 text-sm ${
                resetMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
              <div className="flex gap-2">
                {/* ✅ Changed Cancel to Close */}
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setResetMessage({ type: '', text: '' }); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50"
                >
                  {resetting ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerLogin;