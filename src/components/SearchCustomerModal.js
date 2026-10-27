// src/components/SearchCustomerModal.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function SearchCustomerModal({ onClose, onSelectCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const snap = await getDocs(collection(db, 'customers'));
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      // Sort alphabetically by last name
      list.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
      setCustomers(list);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => 
    c.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select Returning Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            placeholder="Search by name, ref ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading customers...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No customers found.</p>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                onClick={() => onSelectCustomer(c)}
                className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 rounded-lg transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-800">{c.lastName}, {c.firstName}</p>
                  <p className="text-xs text-gray-500">{c.referenceId} | {c.phone || 'No phone'}</p>
                </div>
                <span className="text-[#4A90E2] text-sm font-bold">Select →</span>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default SearchCustomerModal;