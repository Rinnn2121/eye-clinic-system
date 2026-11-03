// src/pages/customer/WishlistPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function WishlistPage() {
  const { currentUser, loading: authLoading } = useAuth(); // ✅ Added authLoading
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // ✅ Wait for Auth before fetching
  useEffect(() => {
    if (authLoading) return;

    const fetchWishlist = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }
      
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
  }, [currentUser, authLoading]);

  // ✅ Fixed Remove Logic (Filters by ID and saves the array)
  const handleRemove = async (itemToRemove) => {
    if (!currentUser?.email) return;
    
    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.email);
      const snap = await getDoc(wishlistRef);
      
      if (snap.exists()) {
        const existingItems = snap.data().items || [];
        // Filter out the item by ID
        const newItems = existingItems.filter(i => i.id !== itemToRemove.id);
        
        // Save the updated array
        await updateDoc(wishlistRef, { items: newItems });
        
        // Update UI state
        setWishlistItems(wishlistItems.filter(item => item.id !== itemToRemove.id));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  // Add to Cart Function
  const handleAddToCart = async (item) => {
    if (!currentUser?.email) return;
    
    setAddingId(item.id);

    try {
      const cartRef = doc(db, 'carts', currentUser.email);
      const cartSnap = await getDoc(cartRef);
      
      const cartItem = {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.imageUrl || '',
        quantity: 1,
        color: 'Standard',
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

      setTimeout(() => setAddingId(null), 1500);
    } catch (err) {
      console.error(err);
      setAddingId(null);
    }
  };

  if (loading || authLoading) {
    return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      

      <div className="w-full max-w-[1200px] mx-auto px-4 pb-20">
        <h1 className="text-3xl font-medium text-gray-900 mb-8">My Wishlist</h1>

        {wishlistItems.length === 0 ? (
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
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
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