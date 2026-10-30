// src/pages/customer/ProductPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer'; // ✅ Import the Footer

function ProductPage() {
  const [allFrames, setAllFrames] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(5000); 
  const [selectedTypes, setSelectedTypes] = useState(['Metal Frame', 'Plastic Frame']);
  const [sortBy, setSortBy] = useState('Newest');

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 1. Fetch only Frames from the database
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const items = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const isFrame = data.category === 'Metal Frame' || data.category === 'Plastic Frame';
          const isActive = data.isActive !== false;
          
          if (isFrame && isActive) {
            items.push({ id: doc.id, ...data });
          }
        });
        setAllFrames(items);

        // Auto-adjust the max price slider
        if (items.length > 0) {
          const highestPrice = Math.max(...items.map(i => Number(i.price) || 0));
          setMaxPrice(Math.ceil(highestPrice / 100) * 100);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  // 2. Handle Checkbox Toggle
  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // 3. Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = allFrames;

    // Filter by Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(lower) || 
        p.description?.toLowerCase().includes(lower)
      );
    }

    // Filter by Type (Checkboxes)
    if (selectedTypes.length > 0) {
      result = result.filter(p => selectedTypes.includes(p.category));
    }

    // Filter by Max Price
    result = result.filter(p => Number(p.price) <= maxPrice);

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'Price: Low to High') return Number(a.price) - Number(b.price);
      if (sortBy === 'Price: High to Low') return Number(b.price) - Number(a.price);
      if (sortBy === 'Name: A-Z') return a.name.localeCompare(b.name);
      return 0; 
    });

    return result;
  }, [allFrames, searchTerm, selectedTypes, maxPrice, sortBy]);

  // ✅ Pagination Calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Top Bar: Search & Sort */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search for frames..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none cursor-pointer"
            >
              <option>Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR: Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
          
          {/* Filter by Price */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Filter by Price</span>
            </h3>
            <div className="space-y-3">
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="100"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full accent-[#4A90E2] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>₱0</span>
                <span className="font-bold text-[#4A90E2]">Up to ₱{maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Filter by Type */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Filter by Type</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedTypes.includes('Metal Frame')}
                  onChange={() => toggleType('Metal Frame')}
                  className="w-4 h-4 text-[#4A90E2] rounded border-gray-300 focus:ring-[#4A90E2]"
                />
                <span className="text-sm text-gray-700 group-hover:text-[#4A90E2]">Metal Frames</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedTypes.includes('Plastic Frame')}
                  onChange={() => toggleType('Plastic Frame')}
                  className="w-4 h-4 text-[#4A90E2] rounded border-gray-300 focus:ring-[#4A90E2]"
                />
                <span className="text-sm text-gray-700 group-hover:text-[#4A90E2]">Plastic Frames</span>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: Product Grid */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading frames...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-gray-500 text-lg">No frames match your filters.</p>
              <button onClick={() => { setMaxPrice(10000); setSelectedTypes(['Metal Frame', 'Plastic Frame']); setSearchTerm(''); }} className="mt-4 text-[#4A90E2] hover:underline text-sm font-medium">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                {currentItems.map((product) => (
                  <Link 
                    to={`/customer/products/${product.id}`}
                    key={product.id} 
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
                  >
                    <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      {product.imageUrl ? (
                        <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                      />
                      ) : (
                        <span className="text-5xl opacity-20">🖼️</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1 text-center">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-base font-bold text-gray-900 mt-2">₱{Number(product.price).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ✅ Pagination Controls */}
              <div className="flex justify-center items-center gap-2 mt-auto">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show dots for very long pagination
                    if (totalPages > 7 && pageNum > 3 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                      if (pageNum === 4) return <span key={pageNum} className="px-2 py-1 text-gray-400">...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-md text-sm border ${
                          currentPage === pageNum 
                            ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' 
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ Footer */}
      <Footer />

    </div>
  );
}

export default ProductPage;