import React from 'react';
import { useParams, Link } from 'react-router-dom';

function CustomerHistoryPage() {
  const { customerId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Customer History
          </h1>
          <p className="text-gray-500 mb-6">
            Customer ID: <span className="font-mono">{customerId}</span>
          </p>
          <p className="text-gray-400">
            🚧 Coming soon — past visits will appear here.
          </p>
          <Link
            to="/admin/customers"
            className="inline-block mt-6 text-[#4A90E2] hover:underline"
          >
            ← Back to Customers
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerHistoryPage;