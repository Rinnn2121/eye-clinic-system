// src/pages/admin/CustomerAccountsPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import CreateStaffModal from '../../components/CreateStaffModal';

function CustomerAccountsPage() {
  const { currentUser } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'staff' | 'archived'

  // Data States
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Online Customer Accounts & Staff (From Users Collection)
      const usersSnap = await getDocs(collection(db, 'users'));
      const custList = [];
      const staffList = [];
      const archivedList = [];

      usersSnap.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };

        if (data.role === 'admin' || data.role === 'staff') {
          staffList.push(data);
        } 
        else if (data.role === 'customer') {
          if (data.isArchived === true) {
            archivedList.push(data);
          } else {
            custList.push(data);
          }
        }
      });

      setCustomerAccounts(custList);
      setStaffAccounts(staffList);
      setArchivedAccounts(archivedList);

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
      await deleteDoc(doc(db, 'users', accountToDelete.id));
      
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

  const handleRestore = async (accountId) => {
    try {
      await updateDoc(doc(db, 'users', accountId), {
        isArchived: false,
        restoredAt: new Date().toISOString()
      });
      loadData();
      setAlertConfig({
        type: 'success',
        title: 'Account Restored',
        message: 'The customer has been moved back to the active list.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to restore account.' });
    }
  };

  // Filter Logic
  const getFilteredData = () => {
    let dataToFilter = [];
    if (activeTab === 'customers') dataToFilter = customerAccounts;
    if (activeTab === 'staff') dataToFilter = staffAccounts;
    if (activeTab === 'archived') dataToFilter = archivedAccounts;

    if (!searchTerm) return dataToFilter;
    
    const lower = searchTerm.toLowerCase();
    return dataToFilter.filter(item => 
      item.email?.toLowerCase().includes(lower) ||
      item.firstName?.toLowerCase().includes(lower) ||
      item.lastName?.toLowerCase().includes(lower) ||
      item.name?.toLowerCase().includes(lower) ||
      item.linkedCustomerId?.toLowerCase().includes(lower)
    );
  };

  const filteredData = getFilteredData();

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // ✅ Pagination Calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">Manage registered online accounts and internal staff accounts.</p>
          </div>
          
          {activeTab === 'staff' && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="bg-[#4A90E2] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + Add Staff Account
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'customers' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer Accounts ({customerAccounts.length})
          </button>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'staff' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Staff & Admin Accounts ({staffAccounts.length})
          </button>
          
          <button
            onClick={() => setActiveTab('archived')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'archived' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Archived Customers ({archivedAccounts.length})
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
              placeholder={`Search ${activeTab === 'customers' ? 'customers' : activeTab === 'staff' ? 'staff' : 'archived'} by name, email or ID...`}
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
          ) : currentItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-base">
              No accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-[#dbeafe] text-gray-800 text-left">
                    <th className="px-6 py-4 font-bold">{activeTab === 'staff' ? 'Full Name' : 'Name'}</th>
                    <th className="px-6 py-4 font-bold">Email (Login)</th>
                    
                    {activeTab === 'customers' && <th className="px-6 py-4 font-bold">Status / Linked ID</th>}
                    {activeTab === 'staff' && <th className="px-6 py-4 font-bold">Role</th>}
                    
                    <th className="px-6 py-4 font-bold">Date Created</th>
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item) => {
                    const isSelf = item.email === currentUser?.email;
                    const isAdminAccount = item.role === 'admin';
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          {item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || '—'}
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold text-[#4A90E2] bg-blue-50 px-2 py-0.5 rounded-full uppercase">You</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 text-gray-600">{item.email || item.id}</td>

                        {/* Status / Linked ID */}
                        {activeTab === 'customers' && (
                          <td className="px-6 py-4">
                            {item.linkedCustomerId ? (
                              <span className="bg-green-100 text-green-700 font-mono text-xs font-bold px-2.5 py-1 rounded inline-block">
                                {item.linkedCustomerId}
                              </span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded inline-block">
                                Unlinked
                              </span>
                            )}
                          </td>
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
                          {activeTab === 'archived' ? (
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="bg-green-50 border border-green-200 text-green-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            !isSelf && (
                              <button
                                onClick={() => setAccountToDelete({ ...item, type: activeTab === 'customers' ? 'customer' : 'staff' })}
                                disabled={isAdminAccount}
                                title={isAdminAccount ? "Admin accounts cannot be deleted" : "Delete account"}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                  isAdminAccount 
                                    ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                {isAdminAccount ? 'Protected' : 'Delete'}
                              </button>
                            )
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

        {/* ✅ Pagination Controls */}
        {filteredData.length > 0 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-base bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
            >
              Prev
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Hide middle pages if there are too many
                if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                  if (pageNum === 3) return <span key={pageNum} className="px-2 py-1.5 text-gray-400">...</span>;
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded-md text-base border shadow-sm font-medium ${
                      currentPage === pageNum 
                        ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-base bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
            >
              Next
            </button>
          </div>
        )}

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