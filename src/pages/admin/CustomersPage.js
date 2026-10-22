// src/pages/admin/CustomersPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AddCustomerModal from './AddCustomerModal';

function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [balanceFilter, setBalanceFilter] = useState('All Balances');
  const [paymentFilter, setPaymentFilter] = useState('All Payments'); // ✅ New State

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Top Stats State
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    returning: 0,
    withBalances: 0,
    newBalancesToday: 0
  });

  // ✅ Calculate Stats
  const calculateStats = useCallback((data) => {
    const now = new Date();
    let newCount = 0;
    let returningCount = 0;
    let withBalances = 0;
    let newBalancesToday = 0;
    const todayStr = now.toISOString().split('T')[0];

    data.forEach(c => {
      const createdDate = c.createdAt ? new Date(c.createdAt) : null;
      
      if (createdDate && (now - createdDate) / (1000 * 60 * 60 * 24) <= 7) {
        newCount++;
      }
      
      if (c.totalVisits > 1) {
        returningCount++;
      }

      if ((c.latestBalance || 0) > 0) {
        withBalances++;
        if (c.lastVisit && c.lastVisit.startsWith(todayStr)) {
          newBalancesToday++;
        }
      }
    });

    setStats({
      total: data.length,
      new: newCount,
      returning: returningCount,
      withBalances,
      newBalancesToday
    });
  }, []);

  // ✅ Load all customers
  const loadCustomers = useCallback(async () => {
    try {
      const q = query(collection(db, 'customers'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      
      setCustomers(list);
      setFiltered(list);
      calculateStats(list);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
    setLoading(false);
  }, [calculateStats]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // ✅ Search, Filter & Sort Logic
  useEffect(() => {
    let result = [...customers];

    // 1. Search Term
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((c) =>
        c.referenceId?.toLowerCase().includes(term) ||
        c.firstName?.toLowerCase().includes(term) ||
        c.lastName?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
      );
    }

    // 2. Has Balances Filter
    if (balanceFilter === 'Has Balances') {
      result = result.filter((c) => (c.latestBalance || 0) > 0);
    } else if (balanceFilter === 'No Balance') {
      result = result.filter((c) => !c.latestBalance || c.latestBalance <= 0);
    }

    // 3. Payment Method Filter
    if (paymentFilter !== 'All Payments') {
      result = result.filter((c) => c.latestPaymentMethod === paymentFilter);
    }

    // 4. Sorting Logic
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(a.createdAt || 0);
        const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(b.createdAt || 0);
        return dateB - dateA; 
      } 
      if (sortBy === 'oldest') {
        const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(a.createdAt || 0);
        const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(b.createdAt || 0);
        return dateA - dateB; 
      } 
      if (sortBy === 'alphabetical') {
        const nameA = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
        const nameB = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB); 
      }
      return 0;
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, balanceFilter, paymentFilter, sortBy, customers]);

  // ✅ Clear All Filters Function
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('recent');
    setBalanceFilter('All Balances');
    setPaymentFilter('All Payments');
  };

  const handleNewVisit = (customerId) => navigate(`/admin/patient-record/${customerId}`);
  const handleViewHistory = (customerId) => navigate(`/admin/customer-history/${customerId}`);

  // Pagination Calc
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage customer profiles, visits, prescriptions and payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Total */}
          <div className="bg-[#dbeafe] rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="bg-[#4A90E2] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Customers</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.total}</h2>
              </div>
            </div>
          </div>

          {/* New */}
          <div className="bg-[#f3e8ff] rounded-2xl p-5 border border-purple-200 shadow-sm relative">
            <div className="flex items-center gap-4">
              <div className="bg-[#a855f7] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">👤</div>
              <div>
                <p className="text-sm font-medium text-gray-700">New Customers</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.new}</h2>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
              ↗ 12% <span className="text-gray-500 font-normal">from last week</span>
            </div>
          </div>

          {/* Returning */}
          <div className="bg-[#dcfce7] rounded-2xl p-5 border border-green-200 shadow-sm relative">
            <div className="flex items-center gap-4">
              <div className="bg-[#22c55e] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-700">Returning Customers</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.returning}</h2>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-600 font-medium flex items-center gap-1">
              ↗ 7 <span className="text-gray-500 font-normal">new visits recently</span>
            </div>
          </div>

          {/* Customers with Balances (Replaced Most Requested) */}
          <div className="bg-[#fef3c7] rounded-2xl p-5 border border-yellow-200 shadow-sm relative">
            <div className="flex items-center gap-4">
              <div className="bg-[#fbbf24] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Customers with Balances</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.withBalances}</h2>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 font-medium">
              {stats.newBalancesToday} new outstanding balances
            </div>
          </div>

        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by reference id, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90E2] outline-none text-sm placeholder-gray-500"
            />
          </div>

          {/* Sort Dropdown */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-600 outline-none shadow-sm cursor-pointer"
          >
            <option value="recent">Recent Visits</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Name (A-Z)</option>
          </select>

          {/* Payment Method Filter */}
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-600 outline-none shadow-sm cursor-pointer"
          >
            <option value="All Payments">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Card">Card</option>
          </select>

          {/* Balance Filter */}
          <select 
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-600 outline-none shadow-sm cursor-pointer"
          >
            <option value="All Balances">All Balances</option>
            <option value="Has Balances">Only Unpaid</option>
            <option value="No Balance">Fully Paid</option>
          </select>

          {/* ✅ Clear Filter Button */}
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4A90E2] mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading customers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No customers found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#dbeafe] text-gray-800 text-left">
                    <th className="px-4 py-3 font-semibold">Reference ID</th>
                    <th className="px-4 py-3 font-semibold">Customer Name</th>
                    <th className="px-4 py-3 font-semibold">Phone No.</th>
                    <th className="px-4 py-3 font-semibold">Last Visit</th>
                    <th className="px-4 py-3 font-semibold text-center">Total Visits</th>
                    <th className="px-4 py-3 font-semibold">Payment Method</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((c) => {
                    const hasBalance = (c.latestBalance || 0) > 0;
                    const balanceAmount = c.latestBalance || 0;
                    const paymentMethod = c.latestPaymentMethod || '—';
                    const status = hasBalance ? 'Partial' : (c.totalVisits > 0 ? 'Paid' : '—');
                    
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-[#4A90E2] font-medium text-xs">{c.referenceId}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {c.lastName}, {c.firstName}
                          {c.nickname && <span className="text-gray-400 font-normal"> ({c.nickname})</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center font-medium">{c.totalVisits || 0}</td>
                        <td className="px-4 py-3">
                           <span className={`font-medium text-xs ${
                             paymentMethod === 'Cash' ? 'text-green-600' : 
                             paymentMethod === 'GCash' ? 'text-blue-600' : 
                             paymentMethod === 'Card' ? 'text-purple-600' : 'text-gray-400'
                           }`}>
                             {paymentMethod}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-semibold">
                          {hasBalance ? `₱ ${balanceAmount.toLocaleString()}` : '₱ 0'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-xs uppercase ${
                            status === 'Paid' ? 'text-green-500' : 
                            status === 'Partial' ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleNewVisit(c.id)}
                              className="bg-[#4A90E2] text-white px-3 py-1 rounded text-xs font-medium hover:bg-[#4A90E2]/90 transition-colors"
                            >
                              New Visit
                            </button>
                            <button
                              onClick={() => handleViewHistory(c.id)}
                              className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                  if (pageNum === 3) return <span key={pageNum} className="px-2 py-1.5 text-gray-400">...</span>;
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      currentPage === pageNum 
                        ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
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
          onCustomerCreated={loadCustomers}
        />
      )}
    </div>
  );
}

export default CustomersPage;