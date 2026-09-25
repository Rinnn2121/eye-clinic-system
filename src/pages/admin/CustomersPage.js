import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AddCustomerModal from './AddCustomerModal';

function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ✅ Load all customers
  const loadCustomers = async () => {
    try {
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setCustomers(list);
      setFiltered(list);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFiltered(customers);
      return;
    }
    setFiltered(
      customers.filter((c) =>
        c.referenceId?.toLowerCase().includes(term) ||
        c.firstName?.toLowerCase().includes(term) ||
        c.lastName?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
      )
    );
  }, [searchTerm, customers]);

  // ✅ New Visit → go to Patient Record
  const handleNewVisit = (customerId) => {
    navigate(`/admin/patient-record/${customerId}`);
  };

  // ✅ View History (optional page)
  const handleViewHistory = (customerId) => {
    navigate(`/admin/customer-history/${customerId}`);
  };

  // ✅ After modal save
  const handleCustomerCreated = async (newCustomer) => {
    await loadCustomers();
    if (newCustomer) {
      // Offer to start a visit
      // (modal already asked via confirm)
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Customers</h1>
            <p className="text-gray-500 text-sm mt-1">
              Search for returning customers or register new ones.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90"
          >
            + Add Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by Reference ID, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4A90E2] mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading customers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {searchTerm ? 'No customers match your search.' : 'No customers yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#dbeafe] text-gray-800">
                    <th className="text-left px-6 py-3 font-semibold">Ref ID</th>
                    <th className="text-left px-6 py-3 font-semibold">Name</th>
                    <th className="text-left px-6 py-3 font-semibold">Phone</th>
                    <th className="text-left px-6 py-3 font-semibold">Last Visit</th>
                    <th className="text-left px-6 py-3 font-semibold">Visits</th>
                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-[#4A90E2] font-medium">
                        {c.referenceId}
                      </td>
                      <td className="px-6 py-4">
                        {c.lastName}, {c.firstName}
                        {c.nickname && (
                          <span className="text-gray-500"> ({c.nickname})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.lastVisit
                          ? new Date(c.lastVisit).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {c.totalVisits || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNewVisit(c.id)}
                            className="bg-[#4A90E2] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#4A90E2]/90"
                          >
                            New Visit
                          </button>
                          <button
                            onClick={() => handleViewHistory(c.id)}
                            className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-50"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddCustomerModal
          onClose={(startVisitWithId) => {
            setShowModal(false);
            if (startVisitWithId) {
              navigate(`/admin/patient-record/${startVisitWithId}`);
            }
          }}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
}

export default CustomersPage;