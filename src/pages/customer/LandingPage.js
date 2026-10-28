// src/pages/customer/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function LandingPage() {
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [metalFrames, setMetalFrames] = useState([]);
  const [plasticFrames, setPlasticFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const allProducts = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          // ✅ Only show active items
          if (data.isActive !== false) {
            allProducts.push({ id: doc.id, ...data });
          }
        });

        // Sort by createdAt (newest first)
        const sortedProducts = allProducts.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        // ✅ Get latest 4 for Best Seller (only Frames)
        const framesOnly = sortedProducts.filter(p => p.category === 'Metal Frame' || p.category === 'Plastic Frame');
        setBestSellerProducts(framesOnly.slice(0, 4));

        // ✅ Filter by specific categories
        setMetalFrames(sortedProducts.filter(p => p.category === 'Metal Frame').slice(0, 4));
        setPlasticFrames(sortedProducts.filter(p => p.category === 'Plastic Frame').slice(0, 4));
        setLenses(sortedProducts.filter(p => p.category === 'Lens Type').slice(0, 4));
        setPackages(sortedProducts.filter(p => p.category === 'Package').slice(0, 4));

      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
        
        {/* Welcome Section */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-100 rounded-3xl mb-12">
          <img 
            src="/images/aoc.jpg" 
            alt="Welcome to Vitug-Sumaya Optical Clinic"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-12 left-8 md:left-16 z-10">
            <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-2xl">
              Welcome to <br />
              <span className="text-[#4A90E2]">Vitug - Sumaya Optical Clinic</span>
            </h1>
            <Link 
              to="/customer/products" 
              className="inline-block mt-6 bg-[#4A90E2] text-white px-8 py-3 rounded-xl hover:bg-[#4A90E2]/80 transition-colors font-medium text-sm md:text-base shadow-lg"
            >
              Shop Frames Now
            </Link>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Best Seller Section (Frames Only) */}
            {bestSellerProducts.length > 0 && (
              <section className="mb-16">
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
                  <Link to="/customer/products" className="text-[#4A90E2] hover:underline text-sm font-medium">
                    View all frames →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {bestSellerProducts.map((product) => (
                    <div key={product.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-6xl opacity-20">🖼️</span>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                        <p className="text-[#4A90E2] font-bold text-sm mt-1">₱ {Number(product.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Category Navigation */}
            <div className="flex justify-center gap-3 mb-12 flex-wrap">
              <Link to="/customer/products" className="px-6 py-2.5 bg-[#4A90E2] text-white rounded-full hover:bg-[#4A90E2]/80 transition-colors text-sm font-medium shadow-md">
                All Frames
              </Link>
              <Link to="/customer/products" className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors text-sm font-medium">
                Metal Frames
              </Link>
              <Link to="/customer/products" className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors text-sm font-medium">
                Plastic Frames
              </Link>
              <Link to="/customer/products" className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors text-sm font-medium">
                Lenses & Coatings
              </Link>
            </div>

            {/* Metal Frames Section */}
            {metalFrames.length > 0 && (
              <section className="mb-16">
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Metal Frames</h2>
                  <Link to="/customer/products" className="text-[#4A90E2] hover:underline text-sm font-medium">
                    View more →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {metalFrames.map((product) => (
                    <div key={product.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-6xl opacity-20">🖼️</span>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                        <p className="text-[#4A90E2] font-bold text-sm mt-1">₱ {Number(product.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Plastic Frames Section */}
            {plasticFrames.length > 0 && (
              <section className="mb-16">
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Plastic Frames</h2>
                  <Link to="/customer/products" className="text-[#4A90E2] hover:underline text-sm font-medium">
                    View more →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {plasticFrames.map((product) => (
                    <div key={product.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-6xl opacity-20">🖼️</span>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                        <p className="text-[#4A90E2] font-bold text-sm mt-1">₱ {Number(product.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lenses Section */}
            {lenses.length > 0 && (
              <section className="mb-16 bg-blue-50/50 rounded-3xl p-6 md:p-10">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lenses & Coatings</h2>
                    <p className="text-gray-500 text-sm mt-1">Upgrade your vision with our premium lenses.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {lenses.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                      <p className="text-[#4A90E2] font-bold text-sm mt-2">₱ {Number(product.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Packages Section */}
            {packages.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Frame + Lens Packages</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packages.map((product) => (
                    <div key={product.id} className="bg-gradient-to-br from-[#4A90E2] to-blue-700 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between h-full">
                      <div>
                        <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl">🎁</div>
                        <h3 className="font-bold text-xl">{product.name}</h3>
                        <p className="text-blue-100 text-sm mt-2">{product.description || 'Complete eyewear solution.'}</p>
                      </div>
                      <div className="mt-6">
                        <p className="text-2xl font-bold">₱ {Number(product.price).toLocaleString()}</p>
                        <Link to={`/contact?product=${encodeURIComponent(product.name)}`} className="block w-full text-center bg-white text-[#4A90E2] mt-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
                          Inquire Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default LandingPage;