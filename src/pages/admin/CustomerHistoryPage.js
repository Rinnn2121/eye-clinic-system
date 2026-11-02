// src/pages/admin/CustomerHistoryPage.js

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';
import ViewRecordModal from '../../components/ViewRecordModal';

function CustomerHistoryPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [viewRecord, setViewRecord] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [newPayment, setNewPayment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // ✅ Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 records per page

  const loadData = useCallback(async () => {
    try {
      const cSnap = await getDoc(doc(db, 'customers', customerId));
      if (cSnap.exists()) setCustomer({ id: cSnap.id, ...cSnap.data() });

      const q = query(collection(db, 'records'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      
      // Sort by exact timestamp (Newest first)
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });

      setRecords(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!paymentRecord) return;
    setUpdating(true);

    try {
      const paymentAmount = Number(newPayment);
      const updatedAmountPaid = (paymentRecord.amountPaid || 0) + paymentAmount;
      const updatedBalance = paymentRecord.total - updatedAmountPaid;
      const newStatus = updatedBalance <= 0 ? 'paid' : 'pending';

      await updateDoc(doc(db, 'records', paymentRecord.id), {
        amountPaid: updatedAmountPaid,
        balance: updatedBalance > 0 ? updatedBalance : 0,
        paymentStatus: newStatus
      });

      if (paymentRecord.receiptNo) {
        const q = query(collection(db, 'orders'), where('receiptNo', '==', paymentRecord.receiptNo));
        const ordersSnap = await getDocs(q);
        ordersSnap.forEach(async (orderDoc) => {
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            amountPaid: updatedAmountPaid,
            balance: updatedBalance > 0 ? updatedBalance : 0,
            paymentStatus: newStatus
          });
        });
      }

      await updateDoc(doc(db, 'customers', customerId), {
        latestBalance: updatedBalance > 0 ? updatedBalance : 0,
        latestPaymentStatus: newStatus
      });

      setPaymentRecord(null);
      setNewPayment('');
      setViewRecord(null); 
      loadData(); 

      setAlertConfig({
        type: 'success',
        title: 'Payment Updated!',
        message: 'The balance has been successfully updated.'
      });

    } catch (err) {
      console.error(err);
      setAlertConfig({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update the payment. Please try again.'
      });
    }
    setUpdating(false);
  };

  const handleDeleteCustomer = async () => {
    setDeleting(true);
    try {
      const recordsQuery = query(collection(db, 'records'), where('customerId', '==', customerId));
      const recordsSnap = await getDocs(recordsQuery);
      const deleteRecords = recordsSnap.docs.map(d => deleteDoc(doc(db, 'records', d.id)));
      await Promise.all(deleteRecords);

      const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const ordersSnap = await getDocs(ordersQuery);
      const deleteOrders = ordersSnap.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(deleteOrders);

      await deleteDoc(doc(db, 'customers', customerId));
      navigate('/admin/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ✅ Filter Logic
  const filteredRecords = useMemo(() => {
    let result = records;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => {
        const frameName = r.frame?.name?.toLowerCase() || '';
        const lensName = r.lensType?.name?.toLowerCase() || '';
        const coatingName = r.coating?.name?.toLowerCase() || '';
        const receipt = r.receiptNo?.toLowerCase() || '';
        const date = new Date(r.date).toLocaleDateString().toLowerCase();
        
        return frameName.includes(lower) || lensName.includes(lower) || coatingName.includes(lower) || receipt.includes(lower) || date.includes(lower);
      });
    }

    if (statusFilter !== 'All Status') {
      result = result.filter(r => {
        const isPaid = r.paymentStatus === 'paid';
        return (statusFilter === 'Fully Paid' && isPaid) || (statusFilter === 'Pending' && !isPaid);
      });
    }

    return result;
  }, [records, searchTerm, statusFilter]);

  // ✅ Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ✅ Pagination Calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer?.lastName}, {customer?.firstName}
            </h1>
            <p className="text-gray-500 text-base mt-1">View visit history, prescriptions, and payment records.</p>
          </div>
          <Link to="/admin/customers" className="text-[#4A90E2] hover:underline text-base font-medium mt-1">
            ← Back to Customers
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-base bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="All Status">All Payment Status</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Record List (Card Row Style) */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500 border border-gray-200 text-lg">
            No records found.
          </div>
        ) : (
          <div className="space-y-4">
            {currentRecords.map((r) => {
              const itemNames = [r.frame?.name, r.lensType?.name, r.coating?.name].filter(Boolean).join(', ');
              const timeString = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
              const isPaid = r.paymentStatus === 'paid';

              return (
                <button 
                  key={r.id} 
                  onClick={() => setViewRecord(r)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  {/* Left Side: Date & Items */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="font-bold text-2xl text-gray-900 group-hover:text-[#4A90E2] transition-colors">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </h3>
                      {timeString && <span className="text-sm font-medium text-gray-500">{timeString}</span>}
                      <span className="text-sm font-bold text-[#4A90E2] bg-blue-50 px-2 py-0.5 rounded-full ml-2">
                        {r.receiptNo || 'NO RECEIPT'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-base font-medium truncate max-w-lg">
                        {itemNames || 'No items listed'}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Total, Balance, Status */}
                  <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                    
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₱ {Number(r.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="text-left md:text-right min-w-[100px]">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Balance</p>
                      <p className={`text-lg font-bold ${r.balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        ₱ {Number(r.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <span className={`text-sm px-4 py-1.5 rounded-full font-bold ${
                        isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isPaid ? 'Fully Paid' : 'Pending'}
                      </span>
                    </div>

                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ✅ Pagination */}
        {filteredRecords.length > 0 && (
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

        {/* Danger Zone */}
        <div className="mt-12 pt-6 border-t border-red-200 flex justify-end">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete Customer Account
          </button>
        </div>
      </div>

      {/* View Record Modal */}
      <ViewRecordModal 
        record={viewRecord} 
        customer={customer} 
        onClose={() => setViewRecord(null)} 
        onUpdatePayment={(record) => {
          setPaymentRecord(record);
          setNewPayment('');
        }}
      />

      {/* Update Payment Modal */}
      {paymentRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Update Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Remaining Balance: <strong className="text-red-600">₱{paymentRecord.balance.toLocaleString()}</strong></p>
            <form onSubmit={handleUpdatePayment}>
              <label className="block text-sm font-medium mb-2">Amount Paid Now (₱)</label>
              <input type="number" required value={newPayment} onChange={(e) => setNewPayment(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-[#4A90E2]" placeholder="0" max={paymentRecord.balance} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setPaymentRecord(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={updating} className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50">{updating ? 'Saving...' : 'Save Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Customer Account?"
        message={`Are you sure you want to permanently delete ${customer?.firstName} ${customer?.lastName}? This will also delete all their visit records and sales history. This action CANNOT be undone.`}
        iconType="warning"
        confirmText={deleting ? 'Deleting...' : 'Yes, Delete Everything'}
        confirmColor="red"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCustomer}
      />

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

export default CustomerHistoryPage;