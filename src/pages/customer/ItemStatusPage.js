// src/pages/customer/ItemStatusPage.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function ItemStatusPage() {
  const { currentUser, userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [showProgress, setShowProgress] = useState(true); // ✅ Dropdown State

  const customerId = userData?.linkedCustomerId || currentUser?.email;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customerId) return;

      try {
        // ✅ Use 'in' to check BOTH the Reference ID and the Email
        const idsToSearch = [userData?.linkedCustomerId, currentUser?.email].filter(Boolean);

        const q = query(
          collection(db, 'labOrders'), 
          where('patientId', 'in', idsToSearch)
        );
        
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(items);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [customerId, userData, currentUser]);
  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading item status...</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready': return <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">Ready for Pick-Up</span>;
      case 'picked_up': return <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">Picked Up</span>;
      default: return <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700">In Preparation</span>;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Items Pick-Up Status</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">You don't have any active orders.</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-5 mb-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg truncate max-w-[200px]">{order.frameCategory || 'Custom Frame'}</p>
                <p className="text-sm text-gray-500">Order ID: #{order.id.slice(-5).toUpperCase()}</p>
                <p className="text-sm text-gray-500">Lens: {order.lens}</p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              {getStatusBadge(order.status)}
              <button 
                onClick={() => setSelectedOrder(order)}
                className="text-sm font-medium text-[#4A90E2] border border-[#4A90E2] px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                View Details
              </button>
            </div>
            
          </div>
        ))
      )}

      {/* ✅ ORDER TRACKING MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Blue Progress Banner (Clickable Dropdown) */}
              <div 
                onClick={() => setShowProgress(!showProgress)}
                className="bg-[#4A90E2] rounded-xl p-4 text-white cursor-pointer hover:bg-[#3b82f6] transition-colors"
              >
                <h3 className="font-bold text-lg flex justify-between items-center">
                  {selectedOrder.status === 'picked_up' ? 'Your Order is Completed' : 'Order Progress'}
                  <svg 
                    className={`w-5 h-5 transition-transform duration-200 ${showProgress ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </h3>
              </div>
              
              {/* Tracking Timeline (Only shows when toggled) */}
              {showProgress && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="font-bold text-gray-800 mb-6 text-sm">Order Progress</p>
                  <div className="flex justify-between items-start relative px-2">
                    <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>
                    
                    <div className="flex flex-col items-center z-10 w-16">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white">✓</div>
                      <p className="text-[10px] text-center font-medium text-gray-600">Order<br/>Placed</p>
                    </div>
                    <div className="flex flex-col items-center z-10 w-16">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white ${['in_progress', 'ready', 'picked_up'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-gray-300'}`}>✓</div>
                      <p className="text-[10px] text-center font-medium text-gray-600">In<br/>Preparation</p>
                    </div>
                    <div className="flex flex-col items-center z-10 w-16">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white ${['ready', 'picked_up'].includes(selectedOrder.status) ? 'bg-green-500' : 'bg-gray-300'}`}>
                         {['ready', 'picked_up'].includes(selectedOrder.status) ? '✓' : ''}
                      </div>
                      <p className="text-[10px] text-center font-medium text-gray-600">Ready to<br/>Pick-Up</p>
                    </div>
                    <div className="flex flex-col items-center z-10 w-16">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white ${selectedOrder.status === 'picked_up' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {selectedOrder.status === 'picked_up' ? '✓' : ''}
                      </div>
                      <p className="text-[10px] text-center font-medium text-gray-600">Picked Up</p>
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />

              {/* ✅ Order Items */}
              <div>
                <h3 className="font-bold text-xl mb-4 text-gray-900">Order #{selectedOrder.id.slice(-5).toUpperCase()}</h3>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedOrder.frameCategory}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.lens} - {selectedOrder.tint || selectedOrder.coating}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">Qty: 1</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* ✅ Total Price */}
              <div className="flex justify-between items-center font-bold text-lg pt-2">
                <span className="text-gray-800">Order Total:</span>
                <span className="text-gray-900">
                  ₱ {Number(selectedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ItemStatusPage;