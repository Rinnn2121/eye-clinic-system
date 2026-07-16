import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SalesPage() {
  const [sales] = useState([
    { id: 1, customer: 'John Doe', product: 'Reading Glasses', amount: 2999, date: '2024-01-15' },
    { id: 2, customer: 'Jane Smith', product: 'Contact Lenses', amount: 1999, date: '2024-01-16' },
    { id: 3, customer: 'Bob Wilson', product: 'Sunglasses', amount: 3999, date: '2024-01-17' },
  ]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">💰 Sales</h1>
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Sales Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Total Sales</p>
            <p className="text-3xl font-bold text-green-600">₱{totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600">{sales.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Average Order</p>
            <p className="text-3xl font-bold text-purple-600">₱{(totalSales / sales.length).toFixed(2)}</p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{sale.customer}</td>
                    <td className="py-3 px-4">{sale.product}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">₱{sale.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-500">{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesPage;