import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // ✅ Added this

function CustomerDashboard() {
  const { currentUser } = useAuth();  // ✅ Use useAuth instead of useCustomer
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        // ✅ Use currentUser.email instead of currentCustomer.name
        const q = query(collection(db, 'appointments'), where('customerEmail', '==', currentUser.email));
        const querySnapshot = await getDocs(q);
        const apts = [];
        querySnapshot.forEach(doc => {
          apts.push({ id: doc.id, ...doc.data() });
        });
        setAppointments(apts);
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
      setLoading(false);
    };
    
    loadAppointments();
  }, [currentUser]);  // ✅ Dependency: currentUser

  // ✅ Check if user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please login to access your dashboard</p>
          <Link to="/customer/login" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </div>
    );
  }

  // ✅ Logout function
  const handleLogout = async () => {
    const { logout } = useAuth();  // Get logout from useAuth
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header - Updated for email login */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {currentUser.email}!</h1>
              <p className="text-blue-100 mt-1">Email: <span className="font-mono">{currentUser.email}</span></p>
            </div>
            <div className="flex gap-3">
              <Link to="/customer/products" className="bg-white text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                👓 Shop
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Next Appointment</p>
            <p className="text-xl font-semibold text-gray-800">
              {appointments.length > 0 ? appointments[0].date : 'None scheduled'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500 text-sm">Member Since</p>
            <p className="text-xl font-semibold text-gray-800">
              {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Link to="/customer/products" className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
            <span className="text-3xl">👓</span>
            <div>
              <h3 className="text-xl font-semibold">Products</h3>
              <p className="text-gray-500">Browse our eyewear collection</p>
            </div>
          </Link>
          
          <Link to="/customer/about" className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
            <span className="text-3xl">ℹ️</span>
            <div>
              <h3 className="text-xl font-semibold">About Us</h3>
              <p className="text-gray-500">Learn more about our clinic</p>
            </div>
          </Link>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">📅 My Appointments</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-xl">
                  <p className="font-semibold">{apt.date} at {apt.time}</p>
                  <p className="text-gray-600 text-sm">Status: <span className="capitalize">{apt.status}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;