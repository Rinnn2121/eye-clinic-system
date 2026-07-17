import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function CustomerRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();  // ✅ Uses signup from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signup(email, password);
      navigate('/customer/dashboard');
    } catch (err) {
      setError('Failed to create account: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A90E2]">VITUG-SUMAYA</h1>
          <p className="text-sm text-gray-500 tracking-wider">OPTICAL CLINIC</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Create Account</h2>
          
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

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A90E2] text-white py-2 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Submit'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/customer/login" className="text-[#4A90E2] hover:underline text-sm font-medium">
              Already have an account? Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerRegister;