// src/components/ProductPreviewModal.js

import React from 'react';

export default function ProductPreviewModal({ product, onClose, onEdit, isAdmin }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Product Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left: Image */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              {/* Fake Thumbnails for visual consistency */}
              <div className="flex gap-2">
                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  product.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.isActive !== false ? 'Active' : 'Disabled'}
                </span>
              </div>
              
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded w-fit mb-4">
                {product.category}
              </span>

              <p className="text-3xl font-bold text-gray-900 mb-6">
                ₱ {Number(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Product Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          
          {/* ✅ Only Admins can see the Edit button */}
          {isAdmin && (
            <button 
              onClick={onEdit} 
              className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              Edit Product
            </button>
          )}
        </div>

      </div>
    </div>
  );
}