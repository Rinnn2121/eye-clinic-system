// src/components/CreateStaffModal.js

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase/config';
import { secondaryAuth } from '../firebase/secondary';
import ConfirmModal from './ConfirmModal';

export default function CreateStaffModal({ onClose }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [creating, setCreating] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      // 1. Create Firebase Auth user via secondary app (admin stays logged in)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );

      // 2. Save the user doc in Firestore
      await setDoc(doc(db, 'users', formData.email.trim()), {
        email: formData.email.trim(),
        role: formData.role,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString()
      });

      // 3. Sign out from secondary app
      await secondaryAuth.signOut();

      setAlertConfig({
        type: 'success',
        title: 'Account Created!',
        message: `${formData.firstName} can now log in at /login with ${formData.email}.`
      });

      // Reset form
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      console.error(err);
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      setAlertConfig({ type: 'error', title: 'Creation Failed', message: errorMessage });
    }
    setCreating(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[80]">
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
          
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Add Staff Account</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
              &times;
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                <input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                <input
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                placeholder="staff@clinic.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <input
                required
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                placeholder="Minimum 6 characters"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Share this temporary password with the staff member.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
              >
                <option value="staff">Staff (no Sales/Reports)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success/Error Alert */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          iconType={alertConfig.type === 'success' ? 'success' : 'error'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => {
            setAlertConfig(null);
            if (alertConfig.type === 'success') onClose();
          }}
        />
      )}
    </>
  );
}