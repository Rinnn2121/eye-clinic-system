// src/pages/admin/LabOrdersPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../../components/ConfirmModal';
import LabTrackingModal from '../../components/LabTrackingModal';

function LabOrdersPage() {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('in_progress'); 
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);

  const loadOrders = async () => {
    try {
      const snap = await getDocs(collection(db, 'labOrders'));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLabOrders(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (order, newStatus) => {
    try {
      const updateData = { status: newStatus };
      // ✅ Save the timestamp when it is picked up
      if (newStatus === 'picked_up') {
        updateData.pickedUpAt = new Date().toISOString();
      }

      // 1. Update the Lab Order Status
      await updateDoc(doc(db, 'labOrders', order.id), updateData);
      
      // 2. Send Notification to Customer if marked "Ready"
      if (newStatus === 'ready' && order.patientId) {
        const custQuery = query(collection(db, 'customers'), where('__name__', '==', order.patientId));
        const custSnap = await getDocs(custQuery);
        
        if (!custSnap.empty) {
          const customerData = custSnap.docs[0].data();
          const email = customerData.email || customerData.linkedEmail;

          if (email) {
            await addDoc(collection(db, 'notifications'), {
              recipient: email.toLowerCase(),
              type: 'order',
              title: 'Item Ready for Pick-Up!',
              message: `Your glasses (Ref: ${order.id.slice(-5)}) are ready for pick up at the clinic.`,
              link: '/customer/item-status',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // 3. Refresh the list and close the modal
      loadOrders();
      setSelectedOrder(null);
      setAlertConfig({
        type: 'success',
        title: 'Status Updated',
        message: `Order has been marked as ${newStatus.replace('_', ' ')}.`
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to update status.' });
    }
  };

  // ✅ Bulk Action: Mark All as Ready
  const handleMarkAllReady = async () => {
    try {
      const ordersToUpdate = filteredOrders; 

      if (ordersToUpdate.length === 0) {
        setShowMarkAllModal(false);
        return;
      }

      await Promise.all(ordersToUpdate.map(async (order) => {
        await updateDoc(doc(db, 'labOrders', order.id), { status: 'ready' });
        
        if (order.patientId) {
          const custQuery = query(collection(db, 'customers'), where('__name__', '==', order.patientId));
          const custSnap = await getDocs(custQuery);
          if (!custSnap.empty) {
            const customerData = custSnap.docs[0].data();
            const email = customerData.email || customerData.linkedEmail;
            if (email) {
              await addDoc(collection(db, 'notifications'), {
                recipient: email.toLowerCase(),
                type: 'order',
                title: 'Item Ready for Pick-Up!',
                message: `Your glasses (Ref: ${order.id.slice(-5)}) are ready for pick up at the clinic.`,
                link: '/customer/item-status',
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }));

      loadOrders();
      setShowMarkAllModal(false);
      setAlertConfig({
        type: 'success',
        title: 'Bulk Update Successful',
        message: `${ordersToUpdate.length} orders have been marked as Ready for Pickup.`
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to update all orders.' });
    }
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return labOrders.filter(order => {
      const matchesTab = order.status === activeTab;
      const matchesSearch = 
        (order.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.frameCategory?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [labOrders, activeTab, searchTerm]);

  // Counts for tabs
  const counts = {
    in_progress: labOrders.filter(o => o.status === 'in_progress').length,
    ready: labOrders.filter(o => o.status === 'ready').length,
    picked_up: labOrders.filter(o => o.status === 'picked_up').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab & Pickup Orders</h1>
        </div>

        {/* ✅ Shortened Search Bar Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by patient or frame..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tabs & Bulk Action */}
        <div className="flex justify-between items-center border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
                activeTab === 'in_progress' 
                  ? 'border-[#eab308] text-yellow-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Laboratory ({counts.in_progress})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
                activeTab === 'ready' 
                  ? 'border-[#22c55e] text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ready for Pickup ({counts.ready})
            </button>
            <button
              onClick={() => setActiveTab('picked_up')}
              className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
                activeTab === 'picked_up' 
                  ? 'border-[#4A90E2] text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Picked Up ({counts.picked_up})
            </button>
          </div>

          {activeTab === 'in_progress' && filteredOrders.length > 0 && (
            <button
              onClick={() => setShowMarkAllModal(true)}
              className="bg-[#22c55e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Mark All as Ready ({filteredOrders.length})
            </button>
          )}
        </div>

        {/* Order List */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            No orders found in this category.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isPickedUp = order.status === 'picked_up';
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-xl text-gray-900">{order.patientName}</h3>
                      <span className="text-sm font-bold text-[#4A90E2] bg-blue-50 px-2 py-0.5 rounded-full">
                        {order.date}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 font-medium">
                      Frame: {order.frameCategory} • Lens: {order.lens}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      OD: {order.od} | OS: {order.os}
                    </p>
                  </div>
                  
                                    <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-gray-400">Balance</p>
                      
                      <p className={`text-lg font-bold ${isPickedUp || !order.balance || Number(order.balance) <= 0 ? 'text-gray-400' : 'text-red-600'}`}>
                        ₱ {isPickedUp ? '0' : Number(order.balance || 0).toLocaleString()}
                      </p>
                      
                      {/* ✅ Show Picked Up Date/Time if applicable */}
                      {isPickedUp && order.pickedUpAt && (
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          Picked up: {new Date(order.pickedUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' '}at{' '}
                          {new Date(order.pickedUpAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ✅ Confirm Bulk Action Modal */}
      <ConfirmModal
        isOpen={showMarkAllModal}
        title="Mark All as Ready?"
        message={`Are you sure you want to mark all ${filteredOrders.length} visible orders as "Ready for Pickup"? This will also notify the customers.`}
        iconType="success"
        confirmText="Yes, Mark All"
        confirmColor="green"
        onCancel={() => setShowMarkAllModal(false)}
        onConfirm={handleMarkAllReady}
      />

      {/* ✅ The Separated Tracking Modal */}
      {selectedOrder && (
        <LabTrackingModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMarkReady={() => handleStatusChange(selectedOrder, 'ready')}
          onMarkPickedUp={() => handleStatusChange(selectedOrder, 'picked_up')}
        />
      )}

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

export default LabOrdersPage;