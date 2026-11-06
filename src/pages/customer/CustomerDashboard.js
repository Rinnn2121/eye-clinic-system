// src/pages/customer/CustomerDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import BookingWizardModal from '../../components/BookingWizardModal';

function CustomerDashboard() {
  const { currentUser, userData } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [nextAppt, setNextAppt] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const customerId = userData?.linkedCustomerId || currentUser?.email;

  const fetchData = useCallback(async () => {
    if (!currentUser?.email) return;

    try {
      let loadedProfile = {};

      // 1. Check if linked to an official clinic record
      const userDoc = await getDoc(doc(db, 'users', currentUser.email));
      const userInfo = userDoc.data() || {};

      if (userInfo.linkedCustomerId) {
        // Fetch from the official customers collection
        const custDoc = await getDoc(doc(db, 'customers', userInfo.linkedCustomerId));
        if (custDoc.exists()) {
          loadedProfile = custDoc.data();
        }
      } else {
        // Fetch from the onlineAccounts collection
        const onlineDoc = await getDoc(doc(db, 'onlineAccounts', currentUser.email));
        if (onlineDoc.exists()) {
          loadedProfile = onlineDoc.data();
        }
      }

      // Fallback to userData from context if no profile found
      setProfile({
        firstName: loadedProfile.firstName || userInfo.firstName || 'Customer',
        lastName: loadedProfile.lastName || userInfo.lastName || '',
        phone: loadedProfile.phone || userInfo.phone || '',
        address: loadedProfile.address || userInfo.address || '',
        photoUrl: userData?.photoUrl || ''
      });

      // 2. Fetch Cart
      const cartDoc = await getDoc(doc(db, 'carts', currentUser.email));
      if (cartDoc.exists()) {
        setCartItems(cartDoc.data().items || []);
      }

      // 3. Fetch Wishlist
      const wishDoc = await getDoc(doc(db, 'wishlists', currentUser.email));
      if (wishDoc.exists()) {
        setWishlistItems(wishDoc.data().items || []);
      }

      // 4. Fetch Next Appointment
      const q = query(
        collection(db, 'appointments'), 
        where('customerId', '==', customerId),
        where('status', 'in', ['Pending', 'Confirmed', 'Scheduled'])
      );
      const apptSnap = await getDocs(q);
      const appts = [];
      apptSnap.forEach(d => appts.push({ id: d.id, ...d.data() }));
      
      appts.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      if (appts.length > 0) setNextAppt(appts[0]);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [currentUser, customerId, userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your dashboard...</div>;

  const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* ✅ WELCOME BANNER (Simplified) */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center h-32">
        <h1 className="text-3xl font-bold text-[#4A90E2]">
          Hello, {profile?.firstName || 'Customer'}!
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ✅ MY CART SUMMARY */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <h3 className="font-bold text-lg">My Cart</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">{cartCount} items • ₱ {cartTotal.toLocaleString()}</p>
          
          <div className="space-y-3 flex-1 mb-4">
            {cartItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex gap-3 items-center border-b border-gray-100 pb-2">
                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">₱ {Number(item.price).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {cartItems.length === 0 && <p className="text-xs text-gray-400">Your cart is empty.</p>}
          </div>

          <Link to="/customer/cart" className="block text-center w-full border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View Cart
          </Link>
        </div>

        {/* ✅ MY WISHLIST SUMMARY */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="font-bold text-lg">My Wishlist</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">{wishlistItems.length} saved items</p>
          
          <div className="space-y-3 flex-1 mb-4">
            {wishlistItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex gap-3 items-center border-b border-gray-100 pb-2">
                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">₱ {Number(item.price).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {wishlistItems.length === 0 && <p className="text-xs text-gray-400">Your wishlist is empty.</p>}
          </div>

          <Link to="/customer/wishlist" className="block text-center w-full border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View Wishlist
          </Link>
        </div>

        {/* ✅ QUICK ACTIONS */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            
            <button 
              onClick={() => setShowBookingModal(true)}
              className="border border-gray-200 rounded-lg p-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex flex-col gap-2 text-left"
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="font-bold">Book an Appointment</span>
              <span className="text-gray-500 text-[10px]">Schedule your visit with our clinic.</span>
            </button>

            <Link to="/customer/products" className="border border-gray-200 rounded-lg p-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex flex-col gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="font-bold">Browse our Products</span>
              <span className="text-gray-500 text-[10px]">Explore our latest eyewear collection.</span>
            </Link>
            <Link to="/customer/transactions" className="border border-gray-200 rounded-lg p-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex flex-col gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="font-bold">My Transactions</span>
              <span className="text-gray-500 text-[10px]">View purchase history.</span>
            </Link>
            <Link to="/customer/item-status" className="border border-gray-200 rounded-lg p-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex flex-col gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-bold">Item Pick-up Status</span>
              <span className="text-gray-500 text-[10px]">Check your order.</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ✅ YOUR NEXT APPOINTMENT */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <h3 className="font-bold text-lg">Your Next Appointment</h3>
            </div>
            <Link to="/customer/appointments" className="text-xs text-blue-600 hover:underline font-bold">View All &gt;</Link>
          </div>
          {nextAppt ? (
            <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{nextAppt.reason}</p>
                <p className="text-sm text-gray-600 mt-1">{nextAppt.date} ({new Date(nextAppt.date).toLocaleDateString('en-US', { weekday: 'long' })})</p>
                <p className="text-sm text-gray-600">{nextAppt.time ? new Date(`2000-01-01T${nextAppt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}</p>
              </div>
              <Link to="/customer/appointments" className="text-xs font-bold text-blue-600 border border-blue-300 px-3 py-1.5 rounded bg-white hover:bg-blue-50">View Details</Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No upcoming appointments scheduled.</p>
          )}
        </div>

        {/* ✅ QUICK PROFILE */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg">Quick Profile</h3>
            </div>
            <Link to="/customer/profile" className="text-xs text-blue-600 hover:underline font-medium">
              Edit Profile
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-2">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : 'C'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm text-gray-500 mb-3">{currentUser?.email}</p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profile?.phone || 'Not provided'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{profile?.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ✅ Booking Wizard Modal */}
      {showBookingModal && (
        <BookingWizardModal 
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchData(); // Refresh the dashboard to show the new appointment!
          }}
        />
      )}

    </div>
  );
}

export default CustomerDashboard;