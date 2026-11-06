// src/pages/customer/CustomerTransactions.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import TransactionDetailsModal from '../../components/TransactionDetailsModal'; // ✅ Import Modal

function CustomerTransactions() {
  const { currentUser, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null); // ✅ State for Modal

  // ✅ Get the correct customer ID (Reference ID if linked, otherwise email)
  const customerId = userData?.linkedCustomerId || currentUser?.email;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customerId) return;

      try {
        // ✅ Use 'in' to check BOTH the Reference ID and the Email
        const idsToSearch = [userData?.linkedCustomerId, currentUser?.email].filter(Boolean);
        
        const q = query(
          collection(db, 'orders'), 
          where('customerId', 'in', idsToSearch)
        );
        
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        
        // Sort newest first
        items.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        setOrders(items);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [customerId, userData, currentUser]);


  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading transactions...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500 text-lg">You don't have any transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isPaid = order.paymentStatus === 'paid' || order.balance <= 0;

            return (
              <div 
                key={order.id} 
                onClick={() => setSelectedSale(order)} // ✅ Clickable Row
                className="border border-gray-200 rounded-xl p-5 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                
                {/* Left: Image & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {order.items?.[0]?.imageUrl ? (
                      <img src={order.items[0].imageUrl} alt={order.items[0].name} className="w-full h-full object-cover" />
                    ) : (
                      /* ✅ SVG Image Placeholder */
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {order.items?.[0]?.name || 'Product Name'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Receipt: <span className="font-medium text-gray-700">{order.receiptNo}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items?.reduce((a, i) => a + (i.qty || 1), 0) || 1} item(s)
                    </p>
                  </div>
                </div>

                {/* Right: Date, Total, Status */}
                <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                  
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱ {Number(order.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isPaid ? 'Fully Paid' : 'Pending'}
                    </span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Transaction Details Modal */}
      {selectedSale && (
        <TransactionDetailsModal 
          sale={selectedSale} 
          onClose={() => setSelectedSale(null)} 
        />
      )}

    </div>
  );
}

export default CustomerTransactions;