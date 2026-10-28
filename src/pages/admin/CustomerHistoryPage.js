// src/pages/admin/CustomerHistoryPage.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // ✅ Added useNavigate
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'; // ✅ Added deleteDoc
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';

function CustomerHistoryPage() {
  const { customerId } = useParams();
  const navigate = useNavigate(); // ✅ Added navigate hook

  const [customer, setCustomer] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the View Record Modal
  const [viewRecord, setViewRecord] = useState(null);
  
  // State for the Update Payment Modal
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [newPayment, setNewPayment] = useState('');
  const [updating, setUpdating] = useState(false);

  // ✅ New states for Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // States for custom alerts
  const [alertConfig, setAlertConfig] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const cSnap = await getDoc(doc(db, 'customers', customerId));
      if (cSnap.exists()) setCustomer({ id: cSnap.id, ...cSnap.data() });

      const q = query(collection(db, 'records'), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
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

      // 1. Update the Record in Firestore
      await updateDoc(doc(db, 'records', paymentRecord.id), {
        amountPaid: updatedAmountPaid,
        balance: updatedBalance > 0 ? updatedBalance : 0,
        paymentStatus: newStatus
      });

      // 2. Update the corresponding Order in Sales using receiptNo
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

  // ✅ Handle Delete Customer (Cascade Delete)
  const handleDeleteCustomer = async () => {
    setDeleting(true);
    try {
      // 1. Delete all records for this customer
      const recordsQuery = query(collection(db, 'records'), where('customerId', '==', customerId));
      const recordsSnap = await getDocs(recordsQuery);
      const deleteRecords = recordsSnap.docs.map(d => deleteDoc(doc(db, 'records', d.id)));
      await Promise.all(deleteRecords);

      // 2. Delete all orders for this customer
      const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const ordersSnap = await getDocs(ordersQuery);
      const deleteOrders = ordersSnap.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(deleteOrders);

      // 3. Delete the customer profile
      await deleteDoc(doc(db, 'customers', customerId));

      // 4. Redirect back to the customers list
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

      {/* VIEW RECORD MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#4A90E2] text-white p-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">Visit Details</h2>
                <p className="text-sm opacity-90">{viewRecord.date}</p>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-2xl leading-none hover:text-gray-200">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-sm font-bold text-gray-500 mb-2">OLD PRESCRIPTION</h4>
                  <p className="text-sm">PD: {viewRecord.oldPd || '—'}</p>
                  <p className="text-sm">OD: {viewRecord.oldPrescription?.od?.sph || '—'}</p>
                  <p className="text-sm">OS: {viewRecord.oldPrescription?.os?.sph || '—'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-bold text-[#4A90E2] mb-2">NEW PRESCRIPTION</h4>
                  <p className="text-sm">PD: {viewRecord.newPd || '—'}</p>
                  <p className="text-sm">OD: {viewRecord.newPrescription?.od?.sph || '—'}</p>
                  <p className="text-sm">OS: {viewRecord.newPrescription?.os?.sph || '—'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-2">FRAME & LENS</h4>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Frame</p>
                    <p className="font-medium">{viewRecord.frame?.name || '—'}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Lens</p>
                    <p className="font-medium">{viewRecord.lensType?.name || '—'}</p>
                  </div>
                </div>
              </div>

              {(viewRecord.prescriptionNotes || viewRecord.additionalNotes) && (
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-2">NOTES</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm border border-yellow-100">
                    {viewRecord.prescriptionNotes && <p>{viewRecord.prescriptionNotes}</p>}
                    {viewRecord.additionalNotes && <p className="text-gray-600 mt-1">{viewRecord.additionalNotes}</p>}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-500 mb-3">PAYMENT BREAKDOWN</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal (Frame + Lens)</span>
                    <span>₱{((viewRecord.total || 0) + (Number(viewRecord.discount) || 0)).toLocaleString()}</span>
                  </div>
                  {Number(viewRecord.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- ₱{Number(viewRecord.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Amount</span>
                    <span>₱{(viewRecord.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid ({viewRecord.paymentMethod})</span>
                    <span>₱{(viewRecord.amountPaid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Balance</span>
                    <span>₱{(viewRecord.balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setViewRecord(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
              {viewRecord.balance > 0 && (
                <button onClick={() => { setPaymentRecord(viewRecord); setNewPayment(''); }} className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90">Update Payment</button>
              )}
            </div>
          </div>
        </div>
      )}

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