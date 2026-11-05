// src/components/CreateStaffModal.js

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { db } from '../firebase/config';
import { secondaryAuth } from '../firebase/secondary';
import ConfirmModal from './ConfirmModal';
import emailjs from '@emailjs/browser';

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
  
  // ✅ State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const EMAILJS_SERVICE_ID = 'service_qd6q6ox'; 
  const EMAILJS_TEMPLATE_ID = 'template_agxoowy'; 
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

      // 2. Send Firebase Verification Email
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

      // 4. Send EmailJS Welcome Email with Temporary Password
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_name: formData.firstName,
            to_email: formData.email.trim(),
            role: formData.role,
            temp_password: formData.password,
            login_link: window.location.origin + '/login'
          },
          EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
        console.error('EmailJS failed to send welcome email:', emailError);
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              />
            </div>

            {/* ✅ Password Field with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Temporary Password *</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'} // ✅ Censored
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
                {/* ✅ Eye Icon Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#4A90E2] focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] bg-white"
              >
                {/* ✅ Simplified Role Names */}
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
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
              onSuccess(); 
            }
            if (alertConfig.type === 'success') onClose();
          }}
        />
      )}
    </>
  );
}