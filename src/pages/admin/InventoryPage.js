// src/pages/admin/InventoryPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function InventoryPage() {
  const { userRole } = useAuth(); 
  const isAdmin = userRole === 'admin'; 

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Products');
  const [sortBy, setSortBy] = useState('Price: Low to High');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Metal Frame',
    price: '',
    description: '',
    isActive: true,
    imageUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin Staff'
  });

  // 1. Fetch Data
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

  // 2. Handle Save (Add or Edit) with Cloudinary
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // ✅ UPLOAD TO CLOUDINARY
      if (imageFile) {
        // 👇 REPLACE THESE WITH YOUR CLOUDINARY DETAILS
        const cloudName = 'qqrflkm1'; 
        const uploadPreset = 'inventory_unsigned';

        const data = new FormData();
        data.append('file', imageFile);
        data.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: data,
        });

        const result = await response.json();
        
        if (result.secure_url) {
          finalImageUrl = result.secure_url;
        } else {
          throw new Error('Image upload failed');
        }
      }

      const dataToSave = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        isActive: formData.isActive,
        imageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Staff',
        createdAt: formData.createdAt
      };

      if (editingId) {
        await updateDoc(doc(db, 'inventory', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'inventory'), dataToSave);
      }
      
      setIsModalOpen(false);
      setImageFile(null);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert("Failed to save product. Please check your connection.");
    }
    setUploading(false);
  };

  // 3. Filter, Sort & Paginate Logic
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
      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      if (sortBy === 'Name: A-Z') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [products, searchTerm, activeTab, sortBy]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedProducts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab, sortBy]);

  const tabs = ['All Products', 'Metal Frame', 'Plastic Frame', 'Lens', 'Coating', 'Package', 'Service'];

  const openEditModal = (item) => {
    if (!isAdmin) return; 

    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      category: item.category || 'Metal Frame',
      price: item.price || '',
      description: item.description || '',
      isActive: item.isActive !== false,
      imageUrl: item.imageUrl || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      updatedBy: item.updatedBy || 'Admin Staff'
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Browse and manage frames, lenses and optical accessories.</p>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', category: 'Metal Frame', price: '', description: '', isActive: true, imageUrl: '', createdAt: new Date().toISOString() });
                setImageFile(null);
                setIsModalOpen(true);
              }}
              className="bg-[#4A90E2] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 shadow-sm"
            >
              + Add Product
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
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
                onClick={() => openEditModal(item)}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow ${
                  isAdmin ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                }`}
              >
                <div className="w-full h-44 bg-gray-100 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-5xl opacity-20">🖼️</span>
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

        {/* Pagination */}
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

      {/* ✅ EDIT/ADD MODAL */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl my-8">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-5">
                  {/* Image Upload Area */}
                  <div className="relative w-full h-64 bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden hover:bg-gray-50 transition-colors">
                    {(imageFile || formData.imageUrl) ? (
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain p-4 bg-white" 
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-5xl opacity-20 block mb-2">🖼️</span>
                        <p className="text-xs text-gray-500 font-medium">Click to upload image</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Product Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="product description -------------------------"
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none h-32"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="space-y-5 flex-1">
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Product Name *</label>
                      <input
                        type="text" required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4A90E2]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] bg-white"
                        >
                          <option value="Metal Frame">Metal Frame</option>
                          <option value="Plastic Frame">Plastic Frame</option>
                          <option value="Lens Type">Lens Type</option>
                          <option value="Coating">Coating</option>
                          <option value="Package">Package</option>
                          <option value="Service">Service</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Price *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                          <input
                            type="number" step="0.01" required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4A90E2]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Status Toggle */}
                  <div className="mt-8">
                    <label className="block text-sm font-bold text-gray-800 mb-3">Status</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: true })}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                          formData.isActive 
                            ? 'bg-[#bbf7d0] text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: false })}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                          !formData.isActive 
                            ? 'bg-[#fecdd3] text-red-800 border border-red-300' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Disabled
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Banner */}
              <div className="mt-8 bg-[#dbeafe] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-blue-900">
                    <span className="text-lg">📝</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase">
                        {editingId ? 'Last Updated' : 'Date Created'}
                      </p>
                      <p className="text-xs font-bold">
                        {new Date(editingId ? formData.updatedAt : formData.createdAt).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-900">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase">Updated By</p>
                      <p className="text-xs font-bold">{formData.updatedBy}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 md:flex-none px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 md:flex-none px-6 py-2 bg-[#4A90E2] text-white rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Save Changes'}
                  </button>
                </div>

              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default InventoryPage;