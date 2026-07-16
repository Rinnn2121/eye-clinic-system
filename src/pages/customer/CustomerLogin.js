import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../../contexts/CustomerContext';

function CustomerLogin() {
  const [referenceId, setReferenceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { validateReferenceId } = useCustomer();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const formattedId = referenceId.trim().toUpperCase();
    const success = await validateReferenceId(formattedId);
    
    if (success) {
      navigate('/customer/dashboard');
    } else {
      setError('Invalid Reference ID. Please check and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">👋 Welcome Back</h2>
          <p className="text-gray-500 mt-2">Enter your Reference ID to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Reference ID
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center font-mono text-lg transition-all"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              placeholder="EC-12345"
              required
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Enter the Reference ID provided by the clinic
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have a Reference ID?{' '}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Contact the clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;