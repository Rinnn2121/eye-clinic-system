// src/pages/admin/CustomerAccountsPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import CreateStaffModal from '../../components/CreateStaffModal';

function CustomerAccountsPage() {
  const { currentUser } = useAuth();
  
  // ✅ 5 Tabs now
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'customers' | 'staff' | 'archived_customers' | 'archived_accounts'

  // Data States
  const [userAccounts, setUserAccounts] = useState([]);
  const [customerRecords, setCustomerRecords] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [archivedCustomers, setArchivedCustomers] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [accountToArchive, setAccountToArchive] = useState(null); 
  const [alertConfig, setAlertConfig] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users Collection
      const usersSnap = await getDocs(collection(db, 'users'));
      const onlineCustList = [];
      const staffList = [];
      const archAccountsList = [];

      usersSnap.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        
        if (data.isArchived === true) {
          archAccountsList.push({ ...data, type: data.role === 'admin' || data.role === 'staff' ? 'staff' : 'user' });
        } else if (data.role === 'admin' || data.role === 'staff') {
          staffList.push(data);
        } else {
          onlineCustList.push(data);
        }
      });

      setUserAccounts(onlineCustList);
      setStaffAccounts(staffList);
      setArchivedAccounts(archAccountsList);

      // 2. Fetch Customers Collection
      const custSnap = await getDocs(collection(db, 'customers'));
      const recordList = [];
      const archCustList = [];
      
      custSnap.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        
        if (data.isArchived === true) {
          archCustList.push({ ...data, type: 'customer_record' });
        } else {
          recordList.push(data);
        }
      });

      setCustomerRecords(recordList);
      setArchivedCustomers(archCustList);

    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ SYNCED ARCHIVE LOGIC
  const handleArchive = async () => {
    if (!accountToArchive) return;
    
    try {
      const emailToArchive = accountToArchive.email;

      // 1. Archive in the 'users' collection (if they have an email)
      if (emailToArchive) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', emailToArchive));
        const usersSnap = await getDocs(usersQuery);
        
        const promises = usersSnap.docs.map(userDoc => 
          updateDoc(doc(db, 'users', userDoc.id), { isArchived: true, archivedAt: new Date().toISOString() })
        );
        await Promise.all(promises);
      } else if (accountToArchive.type === 'user' || accountToArchive.type === 'staff') {
        await updateDoc(doc(db, 'users', accountToArchive.id), { isArchived: true, archivedAt: new Date().toISOString() });
      }

      // 2. Archive in the 'customers' collection (if they have a clinic record)
      if (accountToArchive.type === 'customer_record') {
        await updateDoc(doc(db, 'customers', accountToArchive.id), { isArchived: true, archivedAt: new Date().toISOString() });
      } else if (emailToArchive) {
        const custQuery = query(collection(db, 'customers'), where('email', '==', emailToArchive));
        const custSnap = await getDocs(custQuery);
        
        const custPromises = custSnap.docs.map(custDoc => 
          updateDoc(doc(db, 'customers', custDoc.id), { isArchived: true, archivedAt: new Date().toISOString() })
        );
        await Promise.all(custPromises);
      }
      
      setAccountToArchive(null);
      loadData();
      setAlertConfig({
        type: 'success',
        title: 'Account Archived',
        message: 'The account has been successfully moved to archives.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to archive account.' });
    }
  };

  // ✅ SYNCED RESTORE LOGIC
  const handleRestore = async (account) => {
    try {
      const emailToRestore = account.email;

      // 1. Restore in 'users'
      if (emailToRestore) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', emailToRestore));
        const usersSnap = await getDocs(usersQuery);
        const promises = usersSnap.docs.map(userDoc => 
          updateDoc(doc(db, 'users', userDoc.id), { isArchived: false, restoredAt: new Date().toISOString() })
        );
        await Promise.all(promises);
      } else if (account.type === 'user' || account.type === 'staff') {
        await updateDoc(doc(db, 'users', account.id), { isArchived: false, restoredAt: new Date().toISOString() });
      }

      // 2. Restore in 'customers'
      if (account.type === 'customer_record') {
        await updateDoc(doc(db, 'customers', account.id), { isArchived: false, restoredAt: new Date().toISOString() });
      } else if (emailToRestore) {
        const custQuery = query(collection(db, 'customers'), where('email', '==', emailToRestore));
        const custSnap = await getDocs(custQuery);
        const custPromises = custSnap.docs.map(custDoc => 
          updateDoc(doc(db, 'customers', custDoc.id), { isArchived: false, restoredAt: new Date().toISOString() })
        );
        await Promise.all(custPromises);
      }
      
      loadData();
      setAlertConfig({
        type: 'success',
        title: 'Account Restored',
        message: 'The account has been moved back to the active list.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to restore account.' });
    }
  };

  // Filter Logic
  const getFilteredData = () => {
    let dataToFilter = [];
    if (activeTab === 'users') dataToFilter = userAccounts;
    if (activeTab === 'customers') dataToFilter = customerRecords;
    if (activeTab === 'staff') dataToFilter = staffAccounts;
    if (activeTab === 'archived_customers') dataToFilter = archivedCustomers;
    if (activeTab === 'archived_accounts') dataToFilter = archivedAccounts;

    if (!searchTerm) return dataToFilter;
    
    const lower = searchTerm.toLowerCase();
    return dataToFilter.filter(item => 
      item.email?.toLowerCase().includes(lower) ||
      item.firstName?.toLowerCase().includes(lower) ||
      item.lastName?.toLowerCase().includes(lower) ||
      item.name?.toLowerCase().includes(lower) ||
      item.linkedCustomerId?.toLowerCase().includes(lower) ||
      item.referenceId?.toLowerCase().includes(lower)
    );
  };

  const filteredData = getFilteredData();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

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

        {/* ✅ 5 Tabs */}
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'users' ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer Accounts ({userAccounts.length})
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'customers' ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers ({customerRecords.length})
          </button>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'staff' ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Staff & Admin ({staffAccounts.length})
          </button>
          
          <button
            onClick={() => setActiveTab('archived_customers')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'archived_customers' ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Archived Customers ({archivedCustomers.length})
          </button>

          <button
            onClick={() => setActiveTab('archived_accounts')}
            className={`py-3 px-6 text-sm md:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'archived_accounts' ? 'border-[#4A90E2] text-[#4A90E2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Archived Accounts ({archivedAccounts.length})
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
              placeholder={`Search accounts...`}
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
                    <th className="px-6 py-4 font-bold">Name</th>
                    <th className="px-6 py-4 font-bold">{activeTab === 'customers' || activeTab === 'archived_customers' ? 'Reference ID' : activeTab === 'archived_accounts' ? 'Type / ID' : 'Email (Login)'}</th>
                    
                    {activeTab === 'users' && <th className="px-6 py-4 font-bold">Status / Linked ID</th>}
                    {activeTab === 'staff' && <th className="px-6 py-4 font-bold">Role</th>}
                    
                    <th className="px-6 py-4 font-bold">Date Created</th>
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item) => {
                    const isSelf = item.email === currentUser?.email;
                    const isAdminAccount = item.role === 'admin';
                    const isArchivedTab = activeTab.includes('archived');
                    const isCustomerTab = activeTab.includes('customers');
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          {isCustomerTab
                            ? `${item.lastName || ''}, ${item.firstName || ''}`
                            : item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || '—'
                          }
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold text-[#4A90E2] bg-blue-50 px-2 py-0.5 rounded-full uppercase">You</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 text-gray-600">
                          {isCustomerTab ? (
                             <span className="font-mono text-xs font-bold text-[#4A90E2]">{item.referenceId}</span>
                          ) : activeTab === 'archived_accounts' ? (
                             <span className="text-xs font-bold text-gray-500">{item.type === 'staff' ? 'Staff' : 'Online Account'}</span>
                          ) : (
                             item.email || item.id
                          )}
                        </td>

                        {activeTab === 'users' && (
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
                          {isArchivedTab ? (
                            <button
                              onClick={() => handleRestore(item)}
                              className="bg-green-50 border border-green-200 text-green-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            !isSelf && (
                              <button
                                onClick={() => setAccountToArchive({ ...item, type: activeTab === 'customers' ? 'customer_record' : activeTab === 'users' ? 'user' : 'staff' })}
                                disabled={isAdminAccount}
                                title={isAdminAccount ? "Admin accounts cannot be archived" : "Archive account"}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                  isAdminAccount 
                                    ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100'
                                }`}
                              >
                                {isAdminAccount ? 'Protected' : 'Archive'}
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

        {/* Pagination Controls */}
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

      {/* Create Staff Modal */}
      {showStaffModal && (
        <CreateStaffModal 
          onClose={() => setShowStaffModal(false)} 
          onSuccess={() => {
            loadData();
            setAlertConfig({ type: 'success', title: 'Staff Added', message: 'The new staff account has been created.' });
          }}
        />
      )}

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={!!accountToArchive}
        title={`Archive Account?`}
        message={`Are you sure you want to archive this account? They will be moved to the Archived tab and can be restored later.`}
        iconType="warning"
        confirmText="Yes, Archive"
        confirmColor="red"
        onCancel={() => setAccountToArchive(null)}
        onConfirm={handleArchive}
      />

      {/* Success/Error Alerts */}
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