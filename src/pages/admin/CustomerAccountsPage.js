// src/pages/admin/CustomerAccountsPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';

function CustomerAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);

  // Fetch pending accounts
  const loadAccounts = async () => {
    try {
      const q = query(collection(db, 'onlineAccounts'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setAccounts(list);
    } catch (err) {
      console.error('Error loading online accounts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Filter
  const filteredAccounts = accounts.filter(acc => 
    acc.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.phone?.includes(searchTerm)
  );

  // Delete account
  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteDoc(doc(db, 'onlineAccounts', accountToDelete.id));
      setAccountToDelete(null);
      loadAccounts();
      setAlertConfig({
        type: 'success',
        title: 'Account Removed',
        message: 'The pending online account has been removed.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Failed', message: 'Could not delete the account.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage customers who created an account online but haven't linked a clinic Reference ID yet.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4A90E2] mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No pending online accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#dbeafe] text-gray-800 text-left">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email (Login)</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Date Created</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {acc.lastName}, {acc.firstName}
                        {acc.nickname && <span className="text-gray-400 font-normal"> ({acc.nickname})</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{acc.email}</td>
                      <td className="px-4 py-3 text-gray-600">{acc.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setAccountToDelete(acc)}
                            className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!accountToDelete}
        title="Delete Online Account?"
        message={`Are you sure you want to delete the pending account for ${accountToDelete?.firstName} ${accountToDelete?.lastName}?`}
        iconType="delete"
        confirmText="Yes, Delete"
        confirmColor="red"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
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