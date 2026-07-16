import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

function CustomerRegistration() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const items = [];
      querySnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(items);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateRandomId = () => {
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    return `EC-${String(randomNum).padStart(5, '0')}`;
  };

  const isReferenceIdUnique = async (referenceId) => {
    const q = query(collection(db, 'customers'), where('referenceId', '==', referenceId));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  };

  const generateUniqueReferenceId = async () => {
    let attempts = 0;
    while (attempts < 50) {
      const referenceId = generateRandomId();
      if (await isReferenceIdUnique(referenceId)) {
        return referenceId;
      }
      attempts++;
    }
    return `EC-${Date.now().toString().slice(-5)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Please enter name and phone');
      return;
    }

    setLoading(true);
    const referenceId = await generateUniqueReferenceId();
    
    try {
      await setDoc(doc(db, 'customers', referenceId), {
        referenceId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        createdAt: new Date().toISOString()
      });
      alert(`✅ Customer created!\nReference ID: ${referenceId}`);
      setNewCustomer({ name: '', phone: '' });
      await loadCustomers();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">👥 Customer Registration</h1>
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Register New Customer</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {loading ? 'Creating...' : 'Generate Reference ID'}
              </button>
            </form>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Registered Customers ({customers.length})</h2>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.referenceId} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-mono text-blue-600">{customer.referenceId}</td>
                      <td className="py-2 px-3">{customer.name}</td>
                      <td className="py-2 px-3">{customer.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegistration;