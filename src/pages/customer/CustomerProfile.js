import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

function CustomerProfile() {
  const { currentUser, userData } = useAuth();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your personal information and account details.</p>
      
      <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-5xl mb-3">👤</div>
          <button className="text-blue-600 font-medium text-sm hover:underline">Change Photo</button>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" defaultValue={`${userData?.firstName || ''} ${userData?.lastName || ''}`} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" disabled defaultValue={currentUser?.email} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input type="tel" defaultValue={userData?.phone} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
            <input type="text" defaultValue={userData?.address} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none" />
          </div>
          <div className="text-right pt-2">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CustomerProfile;