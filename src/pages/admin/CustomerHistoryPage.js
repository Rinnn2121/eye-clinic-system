// src/pages/admin/CustomerHistoryPage.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';
import ViewRecordModal from '../../components/ViewRecordModal'; // ✅ Import the receipt-style modal

function CustomerHistoryPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the View Record Modal
  const [viewRecord, setViewRecord] = useState(null);
  
  // State for the Update Payment Modal
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [newPayment, setNewPayment] = useState('');
  const [updating, setUpdating] = useState(false);

  // State for Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State for custom alerts
  const [alertConfig, setAlertConfig] = useState(null);

    const loadData = useCallback(async () => {
    try {
      const cSnap = await getDoc(doc(db, 'customers', customerId));
      if (cSnap.exists()) setCustomer({ id: cSnap.id, ...cSnap.data() });

      const q = query(collection(db, 'records'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      
      // ✅ Sort by exact timestamp (Newest first)
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA; // Descending order (Latest at top)
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

      // 1. Update the Record
      await updateDoc(doc(db, 'records', paymentRecord.id), {
        amountPaid: updatedAmountPaid,
        balance: updatedBalance > 0 ? updatedBalance : 0,
        paymentStatus: newStatus
      });

      // 2. Update the Order
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

      // 3. Update Customer Profile
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
      // Cascade delete records
      const recordsQuery = query(collection(db, 'records'), where('customerId', '==', customerId));
      const recordsSnap = await getDocs(recordsQuery);
      const deleteRecords = recordsSnap.docs.map(d => deleteDoc(doc(db, 'records', d.id)));
      await Promise.all(deleteRecords);

      // Cascade delete orders
      const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const ordersSnap = await getDocs(ordersQuery);
      const deleteOrders = ordersSnap.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(deleteOrders);

      // Delete customer
      await deleteDoc(doc(db, 'customers', customerId));

      navigate('/admin/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            📜 History — {customer?.lastName}, {customer?.firstName}
          </h1>
          <Link to="/admin/customers" className="text-[#4A90E2] hover:underline">
            ← Back to Customers
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500 border border-gray-200">
            No visits recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r) => {
              const itemNames = [r.frame?.name, r.lensType?.name, r.coating?.name].filter(Boolean).join(', ');
              const timeString = r.createdAt ? new Date(r.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

              return (
                <button 
                  key={r.id} 
                  onClick={() => setViewRecord(r)}
                  className="w-full text-left bg-white rounded-xl border border-gray-300 p-5 hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-xl text-gray-900">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </h3>
                      {timeString && <span className="text-sm font-medium text-gray-500">{timeString}</span>}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      r.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.paymentStatus === 'paid' ? 'Fully Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-1">
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      <span>₱ {Number(r.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {itemNames && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span>{itemNames}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-bold text-red-600">
                      Balance: ₱ {Number(r.balance || 0).toLocaleString()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ✅ Danger Zone / Delete Button */}
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

      {/* ✅ RECEIPT-STYLE VIEW MODAL */}
      <ViewRecordModal 
        record={viewRecord} 
        customer={customer} 
        onClose={() => setViewRecord(null)} 
        onUpdatePayment={(record) => {
          setPaymentRecord(record);
          setNewPayment('');
        }}
      />

      {/* UPDATE PAYMENT MODAL */}
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

      {/* ✅ DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Customer Account?"
        message={`Are you sure you want to permanently delete ${customer?.firstName} ${customer?.lastName}? This will also delete all their visit records and sales history. This action CANNOT be undone.`}
        icon="⚠️"
        confirmText={deleting ? 'Deleting...' : 'Yes, Delete Everything'}
        confirmColor="red"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCustomer}
      />

      {/* ALERTS */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.type === 'success' ? '✅' : '❌'}
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