// src/pages/customer/ProductDetailPage.js

import React, { useState, useEffect } from 'react';
import { useParams, Link} from 'react-router-dom';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext'; // ✅ Import Auth
import ConfirmModal from '../../components/ConfirmModal'; // ✅ Add this

function ProductDetailPage() {
  const { productId } = useParams();
  const { currentUser } = useAuth(); // ✅ Get current user
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [alertConfig, setAlertConfig] = useState(null);
  
  // ✅ Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const docRef = doc(db, 'inventory', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);

          // Fetch related products
          const q = collection(db, 'inventory');
          const snap = await getDocs(q);
          const related = [];
          snap.forEach(d => {
            const item = { id: d.id, ...d.data() };
            if (item.category === data.category && item.id !== data.id && item.isActive !== false) {
              related.push(item);
            }
          });
          setRelatedProducts(related.slice(0, 4));
        }

        // ✅ Check if product is already in the user's wishlist
        if (currentUser?.email) {
          const wishlistRef = doc(db, 'wishlists', currentUser.email);
          const wishlistSnap = await getDoc(wishlistRef);
          if (wishlistSnap.exists()) {
            const items = wishlistSnap.data().items || [];
            if (items.some(i => i.id === productId)) {
              setIsWishlisted(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadProduct();
  }, [productId, currentUser]);

  // ✅ Toggle Wishlist Function
  const handleToggleWishlist = async () => {
    if (!currentUser) {
      setAlertConfig({ type: 'error', title: 'Login Required', message: 'Please login to save items to your wishlist.' });
      return;
    }

    setSavingWishlist(true);
    const wishlistRef = doc(db, 'wishlists', currentUser.email);
    
    try {
      const wishlistSnap = await getDoc(wishlistRef);
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || '',
        category: product.category
      };

      if (!wishlistSnap.exists()) {
        // Create new wishlist document if it doesn't exist
        await setDoc(wishlistRef, { items: [productData] });
        setIsWishlisted(true);
      } else {
        if (isWishlisted) {
          // Remove from wishlist
          await updateDoc(wishlistRef, { items: arrayRemove(productData) });
          setIsWishlisted(false);
        } else {
          // Add to wishlist
          await updateDoc(wishlistRef, { items: arrayUnion(productData) });
          setIsWishlisted(true);
        }
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
    setSavingWishlist(false);
  };
    const handleAddToCart = async () => {
    if (!currentUser) {
      setAlertConfig({ type: 'error', title: 'Login Required', message: 'Please login to add items to your cart.' });
      return;
    }

    try {
      const cartRef = doc(db, 'carts', currentUser.email);
      const cartSnap = await getDoc(cartRef);
      
      const cartItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl || '',
        quantity: quantity,
        color: selectedColor || 'Default',
        isActive: true
      };

      if (!cartSnap.exists()) {
        await setDoc(cartRef, { items: [cartItem] });
      } else {
        const existingItems = cartSnap.data().items || [];
        const existingIndex = existingItems.findIndex(i => i.id === product.id && i.color === cartItem.color);
        
        if (existingIndex > -1) {
          // Update quantity if item already exists
          existingItems[existingIndex].quantity += quantity;
          await updateDoc(cartRef, { items: existingItems });
        } else {
          // Add new item to array
          await updateDoc(cartRef, { items: arrayUnion(cartItem) });
        }
      }
      setAlertConfig({ type: 'success', title: 'Added to Cart!', message: `${quantity}x ${product.name} has been added to your cart.` });
    } catch (err) {
      console.error(err);
    }
  };
  

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div></div>;
  if (!product) return <div className="min-h-screen text-center py-20">Product not found.</div>;

  const colors = ['CPNK CRYSTAL PINK', 'BLK BLACK', 'CRED CRYSTAL RED'];

  return (
    <div className="min-h-screen bg-white">
      
      {/* Breadcrumb ... (Keep your existing Breadcrumb code here) */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-[#4A90E2]">Home</Link>
        <span>&gt;</span>
        <Link to="/customer/products" className="hover:text-[#4A90E2]">Products</Link>
        <span>&gt;</span>
        <span className="text-gray-800 truncate">{product.name}</span>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 pb-20">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN ... (Keep your existing Image and Accordion code here) */}
          <div className="w-full lg:w-8/12 space-y-4">
            <div className="flex gap-4 h-[400px]">
              <div className="flex flex-col items-center gap-2">
                <button className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
                <div className="w-20 h-20 bg-[#f3f4f6] flex items-center justify-center"><span className="text-2xl text-gray-300">🖼️</span></div>
                <div className="w-20 h-20 bg-[#f3f4f6] flex items-center justify-center"><span className="text-2xl text-gray-300">🖼️</span></div>
                <button className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
              </div>
              <div className="flex-1 bg-[#f3f4f6] flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-6" />
                ) : (
                  <span className="text-8xl text-gray-300">🖼️</span>
                )}
              </div>
            </div>

            <div className="w-full">
              <button className="w-full bg-[#4A90E2] text-white px-4 py-2 text-sm font-medium flex justify-center items-center gap-2">
                PRODUCT INFORMATION <span className="text-[10px]">▼</span>
              </button>
              <div className="bg-[#f3f4f6] p-5 space-y-4 text-xs font-medium text-gray-800">
                <p className="flex gap-2"><span className="w-28">Available Lens:</span> <span className="font-normal">Standard, Progressive</span></p>
                <p className="flex gap-2"><span className="w-28">Available Coating:</span> <span className="font-normal">Anti-Reflective, Blue Light</span></p>
                <p className="flex gap-2"><span className="w-28">Material:</span> <span className="font-normal">Premium Acetate</span></p>
                <p className="flex gap-2"><span className="w-28">Frame Type:</span> <span className="font-normal">{product.category}</span></p>
                <p className="flex gap-2"><span className="w-28">Size:</span> <span className="font-normal">Medium (52-18-145)</span></p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Details */}
          <div className="w-full lg:w-4/12 p-6 border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.05)] rounded-md">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>
            <div className="w-full h-px bg-gray-300 my-4"></div>
            <p className="text-xl font-bold text-gray-900 mb-8">₱ {Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>

            <div className="mb-10">
              <p className="text-sm font-bold text-gray-900 mb-3">Frame Colors:</p>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} className={`px-3 py-1.5 text-[11px] font-medium border ${selectedColor === c ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-gray-400 text-gray-800'} bg-white transition-colors`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-gray-400 h-10 w-24">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-gray-600 hover:bg-gray-50 flex-1">-</button>
                <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-gray-600 hover:bg-gray-50 flex-1">+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="bg-[#4A90E2] text-white px-6 h-10 flex items-center justify-center gap-2 text-xs font-medium hover:bg-[#4A90E2]/90 transition-colors flex-1 tracking-wide"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                ADD TO CART
                </button>
            </div>

            {/* ✅ WISHLIST BUTTON */}
            <button 
              onClick={handleToggleWishlist}
              disabled={savingWishlist}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                isWishlisted ? 'text-[#4A90E2]' : 'text-gray-900 hover:text-[#4A90E2]'
              }`}
            >
              <svg 
                className="w-5 h-5" 
                fill={isWishlisted ? "#4A90E2" : "none"} 
                stroke={isWishlisted ? "#4A90E2" : "currentColor"} 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {savingWishlist ? 'SAVING...' : isWishlisted ? 'IN WISHLIST' : 'ADD TO WISHLIST'}
            </button>
          </div>
        </div>

        {/* NOTICE BANNER & RELATED PRODUCTS ... (Keep your existing code here) */}
        <div className="mt-8 bg-[#d0e2fd] text-blue-900 px-6 py-4 rounded-md flex items-center gap-3 w-full lg:w-8/12">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm font-medium">Our clinic team will help recommend suitable lenses and coating during your visit.</p>
        </div>

        <div className="mt-16">
          <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Related Products</h2>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A90E2]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <Link to={`/customer/products/${rp.id}`} key={rp.id} className="group block">
                <div className="w-full aspect-square bg-[#f3f4f6] overflow-hidden mb-3 flex items-center justify-center">
                  {rp.imageUrl ? (
                    <img src={rp.imageUrl} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-6xl text-gray-300">🖼️</span>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm truncate">{rp.name}</h3>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">₱ {Number(rp.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
                      {/* ✅ Custom Alerts */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.type === 'success' ? '✅' : '⚠️'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => setAlertConfig(null)}
        />
      )}
      </div>
    </div>
  );
}

export default ProductDetailPage;