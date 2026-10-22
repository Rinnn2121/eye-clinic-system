// src/pages/admin/AddCustomerModal.js

import React, { useState } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function AddCustomerModal({ onClose, onCustomerCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    address: '',
    age: '',
    occupation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ Tracks the created customer ID so we can show the success UI
  const [createdCustomerId, setCreatedCustomerId] = useState(null);

  // ✅ Generate unique Reference ID
  const generateUniqueReferenceId = async () => {
    let attempts = 0;
    while (attempts < 50) {
      const num = Math.floor(Math.random() * 99999) + 1;
      const id = `EC-${String(num).padStart(5, '0')}`;

      const snap = await getDocs(collection(db, 'customers'));
      let exists = false;
      snap.forEach((d) => {
        if (d.id === id) exists = true;
      });

      if (!exists) return id;
      attempts++;
    }
    return `EC-${Date.now().toString().slice(-5)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const referenceId = await generateUniqueReferenceId();

      const customerData = {
        referenceId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        age: Number(form.age) || 0,
        occupation: form.occupation.trim(),
        createdAt: new Date().toISOString(),
        lastVisit: null,
        totalVisits: 0,
      };

      await setDoc(doc(db, 'customers', referenceId), customerData);

      // Notify parent (this might trigger a background refresh, but won't close the modal)
      if (onCustomerCreated) {
        onCustomerCreated({ id: referenceId, ...customerData });
      }

      // ✅ Set the ID to show the success screen (keeps modal open)
      setCreatedCustomerId(referenceId);
      
    } catch (err) {
      console.error('Error adding customer:', err);
      setError('Failed to save customer: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* ✅ If customer is NOT created yet, show the Form */}
        {!createdCustomerId ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add Customer</h2>
              <button
                onClick={() => onClose(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text" required value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text" required value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text" value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>

              {/* Age + Occupation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number" value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text" value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => onClose(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Generate ID'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ✅ If customer IS created, show the Success UI inside the SAME modal */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✅
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Customer Created!</h3>
            
            <p className="text-gray-600 text-sm mb-4">
              Reference ID: <strong className="text-gray-900 font-mono">{createdCustomerId}</strong>
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              Would you like to start their visit now?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => onClose(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, Close
              </button>
              <button
                onClick={() => onClose(createdCustomerId)}
                className="flex-1 bg-[#4A90E2] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#4A90E2]/90 transition-colors"
              >
                Start Visit
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AddCustomerModal;