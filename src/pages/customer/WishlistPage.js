// src/pages/customer/WishlistPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayRemove, setDoc, arrayUnion } from 'firebase/firestore'; // ✅ Added setDoc, arrayUnion
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function WishlistPage() {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null); // ✅ Track which item is being added

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser?.email) return;
      
      try {
        const wishlistRef = doc(db, 'wishlists', currentUser.email);
        const snap = await getDoc(wishlistRef);
        
        if (snap.exists()) {
          const savedItems = snap.data().items || [];
          
          // Fetch live status for each item
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
          
          setWishlistItems(updatedItems);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchWishlist();
  }, [currentUser]);

  // Remove Item
  const handleRemove = async (itemToRemove) => {
    if (!currentUser?.email) return;
    
    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.email);
      await updateDoc(wishlistRef, { items: arrayRemove(itemToRemove) });
      setWishlistItems(wishlistItems.filter(item => item.id !== itemToRemove.id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Add to Cart Function
  const handleAddToCart = async (item) => {
    if (!currentUser?.email) return;
    
    setAddingId(item.id); // Show loading state on this specific button

    try {
      const cartRef = doc(db, 'carts', currentUser.email);
      const cartSnap = await getDoc(cartRef);
      
      const cartItem = {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.imageUrl || '',
        quantity: 1,
        color: 'Standard', // Default color since wishlist doesn't track specific color
        isActive: true
      };

      if (!cartSnap.exists()) {
        await setDoc(cartRef, { items: [cartItem] });
      } else {
        const existingItems = cartSnap.data().items || [];
        const existingIndex = existingItems.findIndex(i => i.id === item.id && i.color === cartItem.color);
        
        if (existingIndex > -1) {
          existingItems[existingIndex].quantity += 1;
          await updateDoc(cartRef, { items: existingItems });
        } else {
          await updateDoc(cartRef, { items: arrayUnion(cartItem) });
        }
      }

      // Show success feedback briefly
      setTimeout(() => setAddingId(null), 1500);
    } catch (err) {
      console.error(err);
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-[#4A90E2]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" /></svg>
        </Link>
        <span>&gt;</span>
        <span className="text-gray-800">Wishlist</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-medium text-gray-900 mb-8">My Wishlist</h1>

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto"></div></div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 bg-[#d0e1fd] px-6 py-4 rounded-sm text-gray-900 font-bold text-sm">
              <div className="col-span-5">PRODUCT</div>
              <div className="col-span-2 text-center">PRICE</div>
              <div className="col-span-3 text-center">ITEM STATUS</div>
              <div className="col-span-2 text-center">ACTIONS</div>
            </div>

            {/* List */}
            {wishlistItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-6 border-b border-gray-200">
                
                <div className="col-span-5 flex items-center gap-4">
                  <button onClick={() => handleRemove(item)} className="text-gray-800 hover:text-red-500 font-bold text-lg px-2" title="Remove">×</button>
                  <div className="w-24 h-24 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-300">🖼️</span>
                    )}
                  </div>
                  <div>
                    <Link to={`/customer/products/${item.id}`} className="font-semibold text-gray-900 text-sm leading-tight max-w-[250px] hover:text-[#4A90E2] hover:underline">
                      {item.name}
                    </Link>
                  </div>
                </div>

                <div className="col-span-2 text-center font-bold text-gray-900">
                  ₱ {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>

                <div className={`col-span-3 text-center text-sm font-medium ${item.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {item.isActive ? 'Available' : 'Not Available'}
                </div>

                {/* ✅ Add to Cart Button */}
                <div className="col-span-2 text-center">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.isActive || addingId === item.id}
                    className={`text-sm font-medium transition-colors ${
                      !item.isActive 
                        ? 'text-gray-400 cursor-not-allowed'
                        : addingId === item.id
                        ? 'text-green-600'
                        : 'text-gray-700 hover:text-[#4A90E2] hover:underline'
                    }`}
                  >
                    {addingId === item.id ? '✓ Added!' : 'Add To Cart'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;