import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function CustomerTransactions() {
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
      <h1 className="text-3xl font-bold mb-1">My Transactions</h1>
      <p className="text-gray-500 text-sm mb-6">View your purchase history and receipt.</p>

      {orders.map(order => (
        <div key={order.id} className="border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200"></div>
            <div>
              <p className="font-bold text-gray-800">{order.items?.[0]?.name || 'Product Name'}</p>
              <p className="text-xs text-gray-500">{order.items?.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className="text-center">
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">₱ {Number(order.totalAmount).toLocaleString()}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.paymentStatus === 'paid' ? 'Completed' : 'Pending'}
            </span>
            <button className="border border-gray-300 text-gray-700 px-3 py-1 text-xs rounded hover:bg-gray-50">View Details</button>
          </div>
        </div>
      ))}
    </div>
  );
}
export default CustomerTransactions;