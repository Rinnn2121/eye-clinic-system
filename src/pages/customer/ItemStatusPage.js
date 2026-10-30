import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function ItemStatusPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'orders'), where('customerId', '==', currentUser.email));
      const snap = await getDocs(q);
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setOrders(items);
    };
    fetch();
  }, [currentUser]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Items Pick-Up Status</h1>
      <p className="text-gray-500 text-sm mb-6">Track the status of your items and get ready to pick them up at the clinic.</p>

      {orders.map(order => (
        <div key={order.id} className="border border-blue-200 rounded-lg p-4 mb-4 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200"></div>
              <div>
                <p className="font-bold text-gray-800">{order.items?.[0]?.name || 'Product Name'}</p>
                <p className="text-xs text-gray-500">Qty: {order.items?.reduce((a, b) => a + b.qty, 0) || 1} items</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold px-3 py-1 rounded ${
                order.pickupStatus === 'ready' ? 'bg-green-100 text-green-700' : 
                order.pickupStatus === 'picked_up' ? 'bg-gray-200 text-gray-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.pickupStatus === 'ready' ? 'Ready for Pick-Up' : 
                 order.pickupStatus === 'picked_up' ? 'Picked Up' : 'In Preparation'}
              </span>
              <button className="border border-gray-300 text-gray-700 px-3 py-1 text-xs rounded hover:bg-gray-50">View Details</button>
            </div>
          </div>
          {order.pickupStatus !== 'picked_up' && (
            <div className="mt-4 bg-blue-50 text-blue-800 text-xs p-2 rounded flex justify-between">
              <span>Expected Ready Date:</span>
              <span className="font-bold">By {order.expectedDate || '****/****/****'}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export default ItemStatusPage;