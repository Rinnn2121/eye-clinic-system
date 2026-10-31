// src/pages/customer/CartPage.js

import React, { useState, useEffect } from 'react';
import { Link} from 'react-router-dom';
import { doc, getDoc, updateDoc} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import BookingWizardModal from '../../components/BookingWizardModal';
import ConfirmModal from '../../components/ConfirmModal'; // ✅ Import the custom modal

function CartPage() {
  const { currentUser } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // Fetch Cart from Firestore
  useEffect(() => {
    const fetchCart = async () => {
      if (!currentUser?.email) return;
      
      try {
        const cartRef = doc(db, 'carts', currentUser.email);
        const snap = await getDoc(cartRef);
        
        if (snap.exists()) {
          const savedItems = snap.data().items || [];
          const updatedItems = await Promise.all(savedItems.map(async (item) => {
            try {
              const productRef = doc(db, 'inventory', item.id);
              const productSnap = await getDoc(productRef);
              
              if (productSnap.exists()) {
                const liveData = productSnap.data();
                return {
                  ...item,
                  isActive: liveData.isActive !== false,
                  name: liveData.name,
                  price: liveData.price,
                  imageUrl: liveData.imageUrl || ''
                };
              }
              return { ...item, isActive: false }; 
            } catch (err) {
              return { ...item, isActive: false };
            }
          }));
          
          setCartItems(updatedItems);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchCart();
  }, [currentUser]);

  // Update Quantity
  const handleUpdateQuantity = async (id, newQty) => {
    if (newQty < 1) return;
    
    const updatedCart = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setCartItems(updatedCart);

    if (currentUser?.email) {
      const cartRef = doc(db, 'carts', currentUser.email);
      await updateDoc(cartRef, { items: updatedCart });
    }
  };

  // Remove Item
  const handleRemove = async (itemToRemove) => {
    const updatedCart = cartItems.filter(item => item.id !== itemToRemove.id);
    setCartItems(updatedCart);

    if (currentUser?.email) {
      const cartRef = doc(db, 'carts', currentUser.email);
      await updateDoc(cartRef, { items: updatedCart });
    }
  };

  // ✅ Clear Entire Cart
  const handleClearCart = async () => {
    setCartItems([]);
    setShowClearModal(false);

    if (currentUser?.email) {
      const cartRef = doc(db, 'carts', currentUser.email);
      // Clear the items array
      await updateDoc(cartRef, { items: [] });
    }
    
    setAlertConfig({ 
      type: 'success', 
      title: 'Cart Cleared', 
      message: 'All items have been removed from your cart.' 
    });
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const total = subtotal; 

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-[#4A90E2]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" /></svg>
        </Link>
        <span>&gt;</span>
        <span className="text-gray-800">Shopping Cart</span>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 pb-20">
        <h1 className="text-3xl font-medium text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500 text-lg mb-4">Your shopping cart is empty.</p>
            <Link to="/customer/products" className="bg-[#4A90E2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#4A90E2]/90 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* LEFT SIDE: Cart Items */}
            <div className="w-full lg:w-2/3 border border-gray-200 rounded-lg overflow-hidden">
              
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 bg-[#d0e1fd] px-6 py-4 text-gray-900 font-bold text-sm">
                <div className="col-span-5">PRODUCT NAME</div>
                <div className="col-span-2 text-center">UNIT PRICE</div>
                <div className="col-span-3 text-center">QTY</div>
                <div className="col-span-2 text-center">SUBTOTAL</div>
              </div>

              {/* Items */}
              {cartItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-6 border-b border-gray-200">
                  
                  <div className="col-span-5 flex items-center gap-4">
                    <button onClick={() => handleRemove(item)} className="text-gray-800 hover:text-red-500 font-bold text-lg px-2" title="Remove">×</button>
                    <div className="w-20 h-20 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-gray-300">🖼️</span>
                      )}
                    </div>
                    <div>
                      <Link to={`/customer/products/${item.id}`} className="font-semibold text-gray-900 text-sm leading-tight hover:text-[#4A90E2] hover:underline line-clamp-2">
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">Color: {item.color || 'Standard'}</p>
                      {!item.isActive && <p className="text-xs text-red-500 mt-1 font-bold">Not Available</p>}
                    </div>
                  </div>

                  <div className="col-span-2 text-center font-medium text-gray-800">
                    ₱ {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <div className="flex items-center border border-gray-300 h-9 w-24">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-2 text-gray-600 hover:bg-gray-50 flex-1 h-full">-</button>
                      <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-2 text-gray-600 hover:bg-gray-50 flex-1 h-full">+</button>
                    </div>
                  </div>

                  <div className="col-span-2 text-center font-bold text-gray-900">
                    ₱ {(Number(item.price) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                </div>
              ))}

              {/* Footer Buttons */}
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
                <Link to="/customer/products" className="border border-gray-400 text-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
                  Continue Shopping
                </Link>
                
                {/* ✅ Clear Cart Button */}
                <button 
                  onClick={() => setShowClearModal(true)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Cart Summary */}
            <div className="w-full lg:w-1/3 space-y-6">
              
              <div className="border border-gray-300 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">CART SUMMARY</h2>
                
                <div className="flex justify-between items-center mb-4 text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">₱ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="w-full h-px bg-gray-300 my-4"></div>
                
                <div className="flex justify-between items-center mb-8 text-lg font-bold text-gray-900">
                  <span>TOTAL</span>
                  <span>₱ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <button 
                  onClick={() => setShowBookingModal(true)} 
                  className="w-full bg-[#4A90E2] text-white py-3 rounded-md text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors flex justify-center items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Book for Appointment
                </button>
              </div>

              {/* Notice */}
              <div className="bg-[#d0e2fd] text-blue-900 p-4 rounded-md flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-xs leading-relaxed">
                  Items in your cart will be shared with the clinic to help prepare for your visit. This does NOT represent an online purchase.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ✅ Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Shopping Cart?"
        message="Are you sure you want to remove all items from your cart? This action cannot be undone."
        icon="🗑️"
        confirmText="Yes, Clear Cart"
        confirmColor="red"
        onCancel={() => setShowClearModal(false)}
        onConfirm={handleClearCart}
      />

      {/* ✅ Booking Wizard Modal */}
      {showBookingModal && (
        <BookingWizardModal 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
          }}
        />
      )}

      {/* ✅ Success/Error Alerts */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.type === 'success' ? '✅' : '❌'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => setAlertConfig(null)}
        />
      )}

    </div>
  );
}

export default CartPage;