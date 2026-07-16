import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    appointments: 0,
    inventory: 0,
    sales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const customers = await getDocs(collection(db, 'customers'));
        const appointments = await getDocs(collection(db, 'appointments'));
        const inventory = await getDocs(collection(db, 'inventory'));
        
        setStats({
          customers: customers.size,
          appointments: appointments.size,
          inventory: inventory.size,
          sales: 0
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 Admin Dashboard</h1>
          <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium">Admin</span>
        </div>
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm">Total Customers</p>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-600">{stats.customers}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm">Appointments</p>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600">{stats.appointments}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm">Inventory Items</p>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-purple-600">{stats.inventory}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm">Sales</p>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-orange-600">{stats.sales}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/appointments" className="bg-blue-500 text-white p-6 rounded-2xl shadow hover:bg-blue-600 transition-all hover:scale-105 text-center">
            <span className="text-3xl block mb-2">📅</span>
            <span className="font-semibold">Appointments</span>
          </Link>
          <Link to="/admin/customers" className="bg-green-500 text-white p-6 rounded-2xl shadow hover:bg-green-600 transition-all hover:scale-105 text-center">
            <span className="text-3xl block mb-2">👥</span>
            <span className="font-semibold">Customers</span>
          </Link>
          <Link to="/admin/inventory" className="bg-purple-500 text-white p-6 rounded-2xl shadow hover:bg-purple-600 transition-all hover:scale-105 text-center">
            <span className="text-3xl block mb-2">📦</span>
            <span className="font-semibold">Inventory</span>
          </Link>
          <Link to="/admin/sales" className="bg-orange-500 text-white p-6 rounded-2xl shadow hover:bg-orange-600 transition-all hover:scale-105 text-center">
            <span className="text-3xl block mb-2">💰</span>
            <span className="font-semibold">Sales</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;