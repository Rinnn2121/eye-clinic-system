// src/pages/admin/CustomerHistoryPage.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';
import ViewRecordModal from '../../components/ViewRecordModal';

function CustomerHistoryPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the View Record Modal
  const [viewRecord, setViewRecord] = useState(null);
  
  // State for the Update Payment Modal
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [newPayment, setNewPayment] = useState('');
  const [updating, setUpdating] = useState(false);

  // ✅ New states for custom ConfirmModal
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

      // Inside CustomerHistoryPage.js

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!paymentRecord) return;
    setUpdating(true);

    try {
      const paymentAmount = Number(newPayment);
      
      // 1. Calculate new totals
      const updatedAmountPaid = (paymentRecord.amountPaid || 0) + paymentAmount;
      const updatedBalance = paymentRecord.total - updatedAmountPaid;
      const newStatus = updatedBalance <= 0 ? 'paid' : 'pending';
      
      // 2. Create the payment entry for the history ledger
      const newPaymentEntry = {
        date: new Date().toISOString(),
        amount: paymentAmount,
        method: paymentRecord.paymentMethod || 'Cash',
        receivedBy: 'Admin Staff' 
      };

      // 3. Get existing history (or empty array if this is the first payment)
      const existingHistory = paymentRecord.paymentHistory || [];

      // 4. Update the Record in Firestore (records collection)
      await updateDoc(doc(db, 'records', paymentRecord.id), {
        amountPaid: updatedAmountPaid,
        balance: updatedBalance > 0 ? updatedBalance : 0,
        paymentStatus: newStatus,
        paymentHistory: [...existingHistory, newPaymentEntry] // ✅ Append to array
      });

      // 5. Update the corresponding Order in Sales
      if (paymentRecord.receiptNo) {
        const q = query(collection(db, 'orders'), where('receiptNo', '==', paymentRecord.receiptNo));
        const ordersSnap = await getDocs(q);
        ordersSnap.forEach(async (orderDoc) => {
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            amountPaid: updatedAmountPaid,
            balance: updatedBalance > 0 ? updatedBalance : 0,
            paymentStatus: newStatus,
            paymentHistory: [...existingHistory, newPaymentEntry] // ✅ Save to order too
          });
        });
      }

      // 6. Update the Customer's profile for the table
      await updateDoc(doc(db, 'customers', customerId), {
        latestBalance: updatedBalance > 0 ? updatedBalance : 0,
        latestPaymentStatus: newStatus
      });

      // 7. Reset UI
      setPaymentRecord(null);
      setNewPayment('');
      setViewRecord(null); // Close the view modal so it refreshes
      
      loadData(); // Refresh the list

      setAlertConfig({
        type: 'success',
        title: 'Payment Recorded!',
        message: `Payment of ₱${paymentAmount.toLocaleString()} has been added to the ledger.`
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
              // Extract and format the items purchased
              const itemNames = [
                r.frame?.name,
                r.lensType?.name,
                r.coating?.name
              ].filter(Boolean).join(', ');

              // Format the time
              const timeString = r.createdAt 
                ? new Date(r.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) 
                : '';

              return (
                <button 
                  key={r.id} 
                  onClick={() => setViewRecord(r)}
                  className="w-full text-left bg-white rounded-xl border border-gray-300 p-5 hover:shadow-md transition-shadow relative"
                >
                  {/* Top Row: Date & Time + Status Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-baseline gap-2">
                      {/* Date (Large) */}
                      <h3 className="font-bold text-xl text-gray-900">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </h3>
                      
                      {/* Time (Smaller & Gray) */}
                      {timeString && (
                        <span className="text-sm font-medium text-black">{timeString}</span>
                      )}
                    </div>
                    
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      r.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.paymentStatus === 'paid' ? 'Fully Paid' : 'Pending'}
                    </span>
                  </div>

                  {/* Bottom Row: Price + Items + Balance */}
                  <div className="flex justify-between items-end mt-1">
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      {/* Price (with .00) */}
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
      </div>

                        {/* ✅ New & Cleaner View Record Modal */}
      <ViewRecordModal 
        record={viewRecord} 
        customer={customer} 
        onClose={() => setViewRecord(null)} 
        onUpdatePayment={(record) => {
          setPaymentRecord(record);   // ✅ Opens the Update Payment modal
          setNewPayment('');          // ✅ Clears the input field
          // Note: We don't close the ViewRecordModal here. It will close automatically when the payment is saved.
        }}
      />
      
      {/* ✅ UPDATE PAYMENT MODAL */}
      {paymentRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Update Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Remaining Balance: <strong className="text-red-600">₱{paymentRecord.balance.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleUpdatePayment}>
              <label className="block text-sm font-medium mb-2">Amount Paid Now (₱)</label>
              <input
                type="number"
                required
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-[#4A90E2]"
                placeholder="0"
                max={paymentRecord.balance}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentRecord(null)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ CUSTOM ALERTS (Replaces native alert) */}
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