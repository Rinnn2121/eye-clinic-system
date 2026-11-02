// src/pages/admin/AdminProfilePage.js

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminProfilePage() {
  const { currentUser, userData, userRole } = useAuth();
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Local state for form
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    photoUrl: userData?.photoUrl || ''
  });

  const [alertConfig, setAlertConfig] = useState(null);

  // ✅ Cloudinary Upload Logic
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const cloudName = 'qqrflkm1'; 
      const uploadPreset = 'profile_unsigned'; // ✅ Using the new preset

      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.secure_url) {
        setFormData(prev => ({ ...prev, photoUrl: result.secure_url }));
        setAlertConfig({ type: 'success', title: 'Photo Uploaded', message: 'Click "Save Changes" to apply your new picture.' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Upload Failed', message: 'Could not upload image. Please try again.' });
    }
    setUploadingImage(false);
  };

  // ✅ Save changes to Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.email), {
        name: formData.name.trim(),
        photoUrl: formData.photoUrl
      });
      
      setAlertConfig({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved successfully.' });
      
      // Note: The AuthContext will automatically pick up the new data 
      // via the onSnapshot listener we added earlier.
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Save Failed', message: err.message });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account details and profile picture.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row gap-8 shadow-sm">
          
          {/* Avatar Upload Section */}
          <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
            <div className="relative w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-3 overflow-hidden group border-2 border-transparent hover:border-[#4A90E2] transition-colors">
              
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}

              {/* Hover Overlay */}
              <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-bold">Change</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-1">Profile Picture</p>
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-500 uppercase font-bold">
                {userRole}
              </div>
            </div>

            <div className="text-right pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#4A90E2] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#4A90E2]/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          iconType={alertConfig.type === 'success' ? 'success' : 'error'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => setAlertConfig(null)}
        />
      )}
    </div>
  );
}