import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

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

      // 2. Update the corresponding Order in Sales
      const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const ordersSnap = await getDocs(q);
      ordersSnap.forEach(async (orderDoc) => {
        const orderData = orderDoc.data();
        if (orderData.totalAmount === paymentRecord.total && orderData.balance > 0) {
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            amountPaid: updatedAmountPaid,
            balance: updatedBalance > 0 ? updatedBalance : 0,
            paymentStatus: newStatus
          });
        }
      });

      alert('✅ Payment updated successfully!');
      setPaymentRecord(null);
      setNewPayment('');
      setViewRecord(null); // Close the view modal if it was open
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update payment');
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
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
            No visits recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {/* ✅ Clickable Record Cards */}
            {records.map((r) => (
              <button 
                key={r.id} 
                onClick={() => setViewRecord(r)}
                className="w-full text-left bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-transparent hover:border-[#4A90E2]"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{r.date}</h3>
                    <p className="text-sm text-gray-500">
                      Total: <strong>₱{(r.total || 0).toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      r.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.paymentStatus === 'paid' ? 'Fully Paid' : 'Pending Balance'}
                    </span>
                    <span className="text-sm font-bold text-red-500">
                      Balance: ₱{(r.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ VIEW RECORD MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="sticky top-0 bg-[#4A90E2] text-white p-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">Visit Details</h2>
                <p className="text-sm opacity-90">{viewRecord.date}</p>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-2xl leading-none hover:text-gray-200">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Prescription Summary */}
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

              {/* Products */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-2">FRAME & LENS</h4>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Frame</p>
                    <p className="font-medium">{viewRecord.frame?.name || '—'}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Lens</p>
                    <p className="font-medium">{viewRecord.lens?.name || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(viewRecord.prescriptionNotes || viewRecord.additionalNotes) && (
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-2">NOTES</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm border border-yellow-100">
                    {viewRecord.prescriptionNotes && <p>{viewRecord.prescriptionNotes}</p>}
                    {viewRecord.additionalNotes && <p className="text-gray-600 mt-1">{viewRecord.additionalNotes}</p>}
                  </div>
                </div>
              )}

              {/* Payment Breakdown */}
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

            {/* Modal Footer Buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 rounded-b-2xl">
              <button 
                onClick={() => setViewRecord(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
              {viewRecord.balance > 0 && (
                <button 
                  onClick={() => {
                    setPaymentRecord(viewRecord);
                    setNewPayment('');
                  }}
                  className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90"
                >
                  Update Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default CustomerHistoryPage;