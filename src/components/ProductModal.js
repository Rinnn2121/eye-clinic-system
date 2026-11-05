// src/components/ProductModal.js

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function ProductModal({ product, onClose, onSuccess }) {
  const isEditing = !!product;
  
  const { userData, currentUser } = useAuth();
  const loggedInName = userData?.name || currentUser?.email?.split('@')[0] || 'Admin Staff';

  const [featuredCount, setFeaturedCount] = useState(0);
  
  useEffect(() => {
    const checkFeaturedCount = async () => {
      const snap = await getDocs(collection(db, 'inventory'));
      let count = 0;
      snap.forEach(doc => {
        if (doc.data().isFeatured === true) count++;
      });
      setFeaturedCount(count);
    };
    checkFeaturedCount();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Metal Frame',
    price: product?.price || '',
    description: product?.description || '',
    
    // ✅ Changed colors to an array (supports legacy string data)
    colors: Array.isArray(product?.colors) 
      ? product.colors 
      : (product?.colors ? product.colors.split(',').map(c => c.trim()) : []),
      
    material: product?.material || '',
    isActive: product?.isActive !== false,
    isFeatured: product?.isFeatured || false, 
    imageUrls: product?.imageUrls || (product?.imageUrl ? [product.imageUrl] : []),
    createdAt: product?.createdAt || new Date().toISOString(),
    updatedAt: product?.updatedAt || new Date().toISOString(),
    updatedBy: product?.updatedBy || loggedInName
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ✅ Color state
  const [newColor, setNewColor] = useState('');
  const handleAddColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
      setNewColor('');
    }
  };
  const handleRemoveColor = (colorToRemove) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== colorToRemove) });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index, isNew) => {
    if (isNew) {
      setImageFiles(imageFiles.filter((_, i) => i !== index));
    } else {
      setFormData(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrls = [...formData.imageUrls];

      if (imageFiles.length > 0) {
        const cloudName = 'vmdtvqty'; 
        const uploadPreset = 'inventory_unsigned';

        for (const file of imageFiles) {
          const data = new FormData();
          data.append('file', file);
          data.append('upload_preset', uploadPreset);
          data.append('folder', 'eyeclinic_inventory');

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: data,
          });

          const result = await response.json();
          if (result.secure_url) {
            finalImageUrls.push(result.secure_url);
          }
        }
      }

      const dataToSave = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        colors: formData.colors, // ✅ Saves as an array now
        material: formData.material,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        imageUrls: finalImageUrls,
        imageUrl: finalImageUrls[0] || '',
        updatedAt: new Date().toISOString(),
        updatedBy: loggedInName, 
        createdAt: formData.createdAt
      };

      if (isEditing) {
        await updateDoc(doc(db, 'inventory', product.id), dataToSave);
      } else {
        await addDoc(collection(db, 'inventory'), dataToSave);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert("Failed to save product. Please check your connection.");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl my-8">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Product Images</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative w-full h-32 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
                      <img src={url} alt="Preview" className="w-full h-full object-contain p-2 bg-white" />
                      <button type="button" onClick={() => removeImage(idx, false)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                  ))}
                  {imageFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative w-full h-32 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain p-2 bg-white" />
                      <button type="button" onClick={() => removeImage(idx, true)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                  ))}
                  <div className="relative w-full h-32 bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden hover:bg-gray-100 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <p className="text-[10px] text-gray-500 font-medium">Add Images</p>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">The first image will be used as the main thumbnail.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Product Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none h-24"
                />
              </div>

              {/* ✅ INDIVIDUAL COLOR BUTTONS */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Frame Colors</label>
                
                {/* List of added colors */}
                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.colors.map((color, idx) => (
                      <span key={idx} className="flex items-center gap-1 bg-blue-50 text-[#4A90E2] border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                        {color}
                        <button type="button" onClick={() => handleRemoveColor(color)} className="hover:text-red-500 text-sm leading-none ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add color input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
                    placeholder="e.g. Black"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    disabled={!newColor.trim()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
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
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4A90E2]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4 mt-2">
                  <h3 className="text-xs font-bold text-[#4A90E2] uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Website Specifications
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-3">Status</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: true })}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                      formData.isActive ? 'bg-[#bbf7d0] text-green-800 border border-green-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: false })}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                      !formData.isActive ? 'bg-[#fecdd3] text-red-800 border border-red-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Disabled
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-800">Featured on Homepage</label>
                  <span className={`text-xs font-bold ${featuredCount >= 4 && !formData.isFeatured ? 'text-red-500' : 'text-gray-500'}`}>
                    {featuredCount} / 4 Selected
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    if (formData.isFeatured) {
                      setFormData({ ...formData, isFeatured: false });
                      return;
                    }
                    if (featuredCount >= 4) {
                      alert("You can only feature up to 4 items on the homepage. Please remove a featured item first.");
                      return;
                    }
                    setFormData({ ...formData, isFeatured: true });
                  }}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                    formData.isFeatured 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                      : featuredCount >= 4 
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.isFeatured ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                  {formData.isFeatured ? 'Yes, Feature this' : featuredCount >= 4 ? 'Limit Reached' : 'Not Featured'}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-8 bg-[#dbeafe] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-blue-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <p className="text-[10px] font-bold uppercase">
                    {isEditing ? 'Last Updated' : 'Date Created'}
                  </p>
                  <p className="text-xs font-bold">
                    {new Date(isEditing ? formData.updatedAt : formData.createdAt).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button type="button" onClick={onClose} className="flex-1 md:flex-none px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={uploading} className="flex-1 md:flex-none px-6 py-2 bg-[#4A90E2] text-white rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm disabled:opacity-50">
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}