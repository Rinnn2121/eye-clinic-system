// src/pages/Login.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ Get userRole and loading from useAuth
  const { login, currentUser, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect ONLY when userRole is set and auth is done loading
  useEffect(() => {
    if (!authLoading && currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'staff') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    }
  }, [currentUser, userRole, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // ✅ DON'T navigate here — useEffect handles it
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A90E2]">VITUG-SUMAYA</h1>
          <p className="text-sm text-gray-500 tracking-wider">OPTICAL CLINIC</p>
        </div>

        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Login</h2>

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
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A90E2] text-white py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Submit'}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="/customer/register" className="text-[#4A90E2] hover:underline text-sm font-medium">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;