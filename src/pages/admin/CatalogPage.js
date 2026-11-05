// src/pages/admin/CatalogPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ProductModal from '../../components/ProductModal';
import ProductPreviewModal from '../../components/ProductPreviewModal';

function CatalogPage() {
  const { userRole } = useAuth(); 
  const isAdmin = userRole === 'admin'; 

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Products');
  const [sortBy, setSortBy] = useState('Price: Low to High');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  // ✅ Modal States
  const [previewProduct, setPreviewProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'inventory'));
      const items = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(lowerTerm) || p.category?.toLowerCase().includes(lowerTerm)
      );
    }

    if (activeTab !== 'All Products') {
      if (activeTab === 'Lens') {
        result = result.filter((p) => p.category === 'Lens Type');
      } else {
        result = result.filter((p) => p.category === activeTab);
      }
    }

    result.sort((a, b) => {
      if (a.isActive === false && b.isActive !== false) return 1;
      if (a.isActive !== false && b.isActive === false) return -1;
      
      // ✅ Keep featured items at the top
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      if (sortBy === 'Name: A-Z') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [products, searchTerm, activeTab, sortBy]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, activeTab, sortBy]);

  const tabs = ['All Products', 'Metal Frame', 'Plastic Frame', 'Lens', 'Coating', 'Package', 'Service'];

  const handleProductClick = (item) => {
    setPreviewProduct(item);
  };

  const handleEditClick = () => {
    setEditingProduct(previewProduct);
    setPreviewProduct(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>
            <p className="text-gray-500 text-sm mt-1">Browse and manage frames, lenses and optical accessories.</p>
          </div>
          
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="bg-[#4A90E2] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 shadow-sm"
            >
              + Add Product
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by product name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Name: A-Z</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[#0e5bcc] text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading products...</div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleProductClick(item)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow cursor-pointer hover:shadow-md"
              >
                <div className="w-full h-44 bg-gray-100 flex items-center justify-center border-b border-gray-100 overflow-hidden relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  
                  {/* ✅ Featured Badge */}
                  {item.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Featured
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.category}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">₱ {Number(item.price).toLocaleString()}.00</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.isActive !== false 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Pagination */}
        {processedProducts.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show ellipsis for large page counts
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
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
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
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* ✅ Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal 
          product={previewProduct}
          isAdmin={isAdmin}
          onClose={() => setPreviewProduct(null)}
          onEdit={handleEditClick}
        />
      )}

      {/* ✅ Edit/Add Modal */}
      {isAdmin && isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadProducts} 
        />
      )}

    </div>
  );
}

export default CatalogPage;