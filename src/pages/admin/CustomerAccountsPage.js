// src/pages/admin/CustomerAccountsPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import CreateStaffModal from '../../components/CreateStaffModal'; // ✅ Import the staff modal

function CustomerAccountsPage() {
  const { currentUser } = useAuth();
  
  // ✅ Tab State
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'staff'

  // Data States
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false); // ✅ Staff creation modal state

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Pending Customer Accounts
      const custQ = query(collection(db, 'customers'), where('status', '==', 'pending_link'));
      const custSnap = await getDocs(custQ);
      const custList = [];
      custSnap.forEach(doc => custList.push({ id: doc.id, ...doc.data() }));
      setCustomerAccounts(custList);

      // 2. Fetch Staff & Admin Accounts
      const usersSnap = await getDocs(collection(db, 'users'));
      const staffList = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.role === 'admin' || data.role === 'staff') {
          staffList.push({ id: doc.id, ...data });
        }
      });
      setStaffAccounts(staffList);

    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Delete Account Logic
  const handleDelete = async () => {
    if (!accountToDelete) return;
    
    try {
      // Delete from users collection (if staff/admin) OR customers (if pending)
      const collectionName = accountToDelete.type === 'staff' ? 'users' : 'customers';
      await deleteDoc(doc(db, collectionName, accountToDelete.id));
      
      setAccountToDelete(null);
      loadData();
      setAlertConfig({
        type: 'success',
        title: 'Account Removed',
        message: 'The account has been successfully deleted.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to delete account.' });
    }
  };

  // Filter Logic
  const getFilteredData = () => {
    const dataToFilter = activeTab === 'customers' ? customerAccounts : staffAccounts;
    if (!searchTerm) return dataToFilter;
    
    const lower = searchTerm.toLowerCase();
    return dataToFilter.filter(item => 
      item.email?.toLowerCase().includes(lower) ||
      item.firstName?.toLowerCase().includes(lower) ||
      item.lastName?.toLowerCase().includes(lower) ||
      item.name?.toLowerCase().includes(lower)
    );
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">Manage pending customer sign-ups and internal staff accounts.</p>
          </div>
          
          {/* Only show "Add Staff" when on Staff tab */}
          {activeTab === 'staff' && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="bg-[#4A90E2] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + Add Staff Account
            </button>
          )}
        </div>

        {/* ✅ Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
              activeTab === 'customers' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer Accounts ({customerAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
              activeTab === 'staff' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Staff & Admin Accounts ({staffAccounts.length})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'customers' ? 'customers' : 'staff'} by name or email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4A90E2] mx-auto"></div>
              <p className="text-gray-500 mt-3 text-base">Loading accounts...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-base">
              No accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-[#dbeafe] text-gray-800 text-left">
                    <th className="px-6 py-4 font-bold">{activeTab === 'customers' ? 'Name' : 'Full Name'}</th>
                    <th className="px-6 py-4 font-bold">Email (Login)</th>
                    {activeTab === 'customers' && <th className="px-6 py-4 font-bold">Phone</th>}
                    {activeTab === 'staff' && <th className="px-6 py-4 font-bold">Role</th>}
                    <th className="px-6 py-4 font-bold">Date Created</th>
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((item) => {
                    const isSelf = item.email === currentUser?.email;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          {activeTab === 'customers' 
                            ? `${item.lastName || ''}, ${item.firstName || ''}`
                            : item.name || '—'
                          }
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold text-[#4A90E2] bg-blue-50 px-2 py-0.5 rounded-full uppercase">You</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.email || item.id}</td>
                        
                        {activeTab === 'customers' && (
                          <td className="px-6 py-4 text-gray-600">{item.phone || '—'}</td>
                        )}
                        
                        {activeTab === 'staff' && (
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                              item.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.role}
                            </span>
                          </td>
                        )}
                        
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          {!isSelf && (
                            <button
                              onClick={() => setAccountToDelete({ ...item, type: activeTab === 'customers' ? 'customer' : 'staff' })}
                              className="bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ✅ Create Staff Modal */}
      {showStaffModal && (
        <CreateStaffModal 
          onClose={() => setShowStaffModal(false)} 
          onSuccess={() => {
            loadData();
            setAlertConfig({ type: 'success', title: 'Staff Added', message: 'The new staff account has been created.' });
          }}
        />
      )}

      {/* ✅ Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!accountToDelete}
        title={`Delete ${accountToDelete?.type === 'staff' ? 'Staff' : 'Customer'} Account?`}
        message={`Are you sure you want to permanently delete the account for ${accountToDelete?.email || accountToDelete?.name}? This action cannot be undone.`}
        iconType="delete"
        confirmText="Yes, Delete"
        confirmColor="red"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
      />

      {/* ✅ Success/Error Alerts */}
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

export default CustomerAccountsPage;