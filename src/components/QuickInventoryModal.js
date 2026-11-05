// src/components/QuickInventoryModal.js

import React, { useState } from 'react';

export default function QuickInventoryModal({ onClose, inventoryList, onItemClick }) {
  const [search, setSearch] = useState('');
  
  const safeInventoryList = Array.isArray(inventoryList) ? inventoryList : [];
  
  const filtered = safeInventoryList.filter(i => {
    const nameMatch = i.name ? i.name.toLowerCase().includes(search.toLowerCase()) : false;
    const categoryMatch = i.category ? i.category.toLowerCase().includes(search.toLowerCase()) : false;
    return nameMatch || categoryMatch;
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Search Catalog</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 bg-gray-50">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search frames, lenses, packages..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No items found.</p>
          ) : (
            filtered.map(item => (
              <div 
                key={item.id} 
                onClick={() => {
                  // ✅ 1. Trigger the click callback to open preview
                  if (onItemClick) onItemClick(item); 
                  // ✅ 2. Close this modal
                  onClose(); 
                }}
                className={`p-3 border-b border-gray-100 last:border-0 flex justify-between items-center rounded-lg transition-colors ${
                  onItemClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <p className="font-bold text-[#4A90E2]">₱{Number(item.price || 0).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}