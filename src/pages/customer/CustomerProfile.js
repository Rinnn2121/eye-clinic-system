// src/pages/customer/CustomerProfile.js

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';

function CustomerProfile() {
  const { currentUser, userData, updateProfilePicture } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(userData?.photoUrl || '');

  // Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '',
    address: '',
  });

  // Link Account State
  const [referenceId, setReferenceId] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  const [linkedId, setLinkedId] = useState(null);

  // Modals
  const [alertConfig, setAlertConfig] = useState(null);

  // 1. Load profile 
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.email) return;

      try {
        const userRef = doc(db, 'users', currentUser.email);
        const userSnap = await getDoc(userRef);
        const userInfo = userSnap.data() || {};
        const linkedCustomerId = userInfo.linkedCustomerId;

        if (linkedCustomerId) {
          const custRef = doc(db, 'customers', linkedCustomerId);
          const custSnap = await getDoc(custRef);
          if (custSnap.exists()) {
            const data = custSnap.data();
            setProfile({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              nickname: data.nickname || '',
              phone: data.phone || '',
              address: data.address || '',
            });
            setIsLinked(true);
            setLinkedId(linkedCustomerId);
          }
        } else {
          const pendingRef = doc(db, 'onlineAccounts', currentUser.email);
          const pendingSnap = await getDoc(pendingRef);
          if (pendingSnap.exists()) {
            const data = pendingSnap.data();
            setProfile({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              nickname: data.nickname || '',
              phone: data.phone || '',
              address: data.address || '',
            });
          }
          setIsLinked(false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
      setLoading(false);
    };
    loadProfile();
  }, [currentUser]);

  // 2. Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      if (isLinked) {
        await updateDoc(doc(db, 'customers', linkedId), {
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          nickname: profile.nickname.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
        });
      } else {
        await updateDoc(doc(db, 'onlineAccounts', currentUser.email), {
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          nickname: profile.nickname.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
        });
      }
      setAlertConfig({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal information has been saved.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to save your profile.' });
    }
    setSaving(false);
  };

  // 3. Handle Link Account
  const handleLink = async () => {
    if (!referenceId.trim()) return;

    setLinking(true);
    try {
      const idToLink = referenceId.trim().toUpperCase();

      const linkedCustomerRef = doc(db, 'customers', idToLink);
      const linkedCustomerSnap = await getDoc(linkedCustomerRef);

      if (!linkedCustomerSnap.exists()) {
        setAlertConfig({
          type: 'error',
          title: 'ID Not Found',
          message: `We couldn't find a clinic record with ID "${idToLink}". Please double-check with the clinic.`
        });
        setLinking(false);
        return;
      }

      const linkedData = linkedCustomerSnap.data();

      const usersQuery = query(collection(db, 'users'), where('linkedCustomerId', '==', idToLink));
      const usersSnap = await getDocs(usersQuery);
      
      if (!usersSnap.empty && usersSnap.docs[0].id !== currentUser.email) {
        setAlertConfig({
          type: 'error',
          title: 'ID Already Linked',
          message: 'This Reference ID is already linked to another account. Please contact the clinic.'
        });
        setLinking(false);
        return;
      }

      const mergedProfile = {
        firstName: linkedData.firstName || profile.firstName,
        lastName: linkedData.lastName || profile.lastName,
        nickname: linkedData.nickname || profile.nickname,
        phone: linkedData.phone || profile.phone,
        address: linkedData.address || profile.address,
        email: linkedData.email || currentUser.email,
      };

      await updateDoc(doc(db, 'customers', idToLink), mergedProfile);

      const pendingRef = doc(db, 'onlineAccounts', currentUser.email);
      const pendingSnap = await getDoc(pendingRef);
      if (pendingSnap.exists()) {
        await deleteDoc(pendingRef);
      }

      await updateDoc(doc(db, 'users', currentUser.email), {
        linkedCustomerId: idToLink,
        role: 'customer'
      });

      setProfile({
        firstName: mergedProfile.firstName,
        lastName: mergedProfile.lastName,
        nickname: mergedProfile.nickname,
        phone: mergedProfile.phone,
        address: mergedProfile.address,
      });
      setIsLinked(true);
      setLinkedId(idToLink);
      setReferenceId('');

      setAlertConfig({
        type: 'success',
        title: 'Account Linked!',
        message: `Your online account is now connected to clinic record ${idToLink}. All your visits and prescriptions are now accessible here.`
      });

    } catch (err) {
      console.error('Link error:', err);
      setAlertConfig({ type: 'error', title: 'Link Failed', message: err.message });
    }
    setLinking(false);
  };

  // Handle Cloudinary Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const cloudName = 'vmdtvqty'; 
      const uploadPreset = 'profile_unsigned';

      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', uploadPreset);
      data.append('folder', 'eyeclinic_profiles');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.secure_url) {
        setImageUrl(result.secure_url);
        await updateProfilePicture(result.secure_url);
        setAlertConfig({ type: 'success', title: 'Photo Updated!', message: 'Your profile picture has been saved.' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Upload Failed', message: 'Could not upload image. Please try again.' });
    }
    setUploadingImage(false);
  };

  const handleResend = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      setAlertConfig({ type: 'success', title: 'Email Sent!', message: 'A new verification link has been sent to your email.' });
    } catch (err) {
      setAlertConfig({ type: 'error', title: 'Error', message: err.message });
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading your profile...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Profile</h1>
        <p className="text-gray-500 text-sm mb-6">
          Manage your personal information and account details.
        </p>
      </div>

      {/* ✅ UNVERIFIED EMAIL BANNER - Moved outside the grid so it doesn't break the layout */}
      {!currentUser?.emailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-yellow-800">Email not verified</p>
            <p className="text-sm text-yellow-700">Please verify your email to secure your account.</p>
          </div>
          <button 
            onClick={handleResend}
            className="bg-white text-yellow-800 border border-yellow-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-100 whitespace-nowrap"
          >
            Resend Email
          </button>
        </div>
      )}

      {/* LINK ACCOUNT BANNER (only if not linked) */}
      {!isLinked && (
        <div className="bg-[#dbeafe] border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#4A90E2] text-white rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Link Your Clinic Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the Reference ID from the clinic (e.g., <span className="font-mono font-bold">EC-00042</span>) to connect your online account to your official patient record. This will show your visit history, prescriptions, and payments.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Reference ID (e.g., EC-00042)"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] font-mono"
                />
                <button
                  onClick={handleLink}
                  disabled={linking || !referenceId.trim()}
                  className="bg-[#4A90E2] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {linking ? 'Linking...' : 'Link Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINKED STATUS (if linked) */}
      {isLinked && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-green-900">Account Linked</p>
            <p className="text-xs text-green-700">Connected to clinic record <span className="font-mono font-bold">{linkedId}</span></p>
          </div>
        </div>
      )}

      {/* PROFILE FORM */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col md:flex-row gap-8">
        
        {/* Avatar section */}
        <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
          <div className="relative w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-3 overflow-hidden group border-2 border-transparent hover:border-[#4A90E2] transition-colors">
            
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}

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
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
                disabled={uploadingImage}
              />
            </label>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">Profile Picture</p>
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50 outline-none text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]"
            />
          </div>

          <div className="text-right pt-2">
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

export default CustomerProfile;