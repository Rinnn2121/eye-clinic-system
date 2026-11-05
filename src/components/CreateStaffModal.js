// src/components/CreateStaffModal.js

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'; // ✅ Added sendEmailVerification
import { db } from '../firebase/config';
import { secondaryAuth } from '../firebase/secondary';
import ConfirmModal from './ConfirmModal';
import emailjs from '@emailjs/browser'; // ✅ Added EmailJS

export default function CreateStaffModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [creating, setCreating] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // ✅ EMAILJS CONFIG - Replace these with your actual IDs
  const EMAILJS_SERVICE_ID = 'service_qd6q6ox'; 
  const EMAILJS_TEMPLATE_ID = 'template_agxoowy'; // (Change this to your "Welcome Staff" template ID)
  const EMAILJS_PUBLIC_KEY = 'EnPJnnKQXm7ASqkp9';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      // 1. Create Firebase Auth user via secondary app
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );

      const newUser = userCredential.user;

      // 2. ✅ Send Firebase Verification Email
      // We do this immediately so they can verify their account.
      try {
        await sendEmailVerification(newUser);
      } catch (verifyErr) {
        console.error("Failed to send verification email:", verifyErr);
      }

      // 3. Save the user doc in Firestore
      await setDoc(doc(db, 'users', formData.email.trim()), {
        email: formData.email.trim(),
        role: formData.role,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        uid: newUser.uid,
        createdAt: new Date().toISOString()
      });

      // 4. ✅ Send EmailJS Welcome Email with Temporary Password
      // (Wrapped in try/catch so if EmailJS fails, the account still gets created)
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_name: formData.firstName,
            to_email: formData.email.trim(),
            role: formData.role,
            temp_password: formData.password,
            login_link: window.location.origin + '/login' // Sends them to your login page
          },
          EMAILJS_PUBLIC_KEY
        );
        console.log('Welcome email sent successfully.');
      } catch (emailError) {
        console.error('EmailJS failed to send welcome email:', emailError);
        // We don't block the account creation if the email fails
      }

      // 5. Sign out from secondary app
      await secondaryAuth.signOut();

      setAlertConfig({
        type: 'success',
        title: 'Account Created!',
        message: `A verification email has been sent to ${formData.email}. They can now log in using the temporary password provided.`
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password *</label>
              <input
                required
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                placeholder="Minimum 6 characters"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                This password will be included in the welcome email.
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
            if (alertConfig.type === 'success' && onSuccess) {
              onSuccess(); // Tell the parent to refresh the list
            }
            if (alertConfig.type === 'success') onClose();
          }}
        />
      )}
    </>
  );
}