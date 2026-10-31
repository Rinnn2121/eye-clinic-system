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

  // ✅ New Time Filter State for the Top Cards
  const [timeFilter, setTimeFilter] = useState('This Week');

  // Table Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [balanceFilter, setBalanceFilter] = useState('All Balances');
  const [paymentFilter, setPaymentFilter] = useState('All Payments');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Top Stats State (Now only 3)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    returning: 0
  });

  // ✅ Calculate Stats based on the Time Filter
  const calculateStats = useCallback((data) => {
    const now = new Date();
    let startDate = new Date();

    if (timeFilter === 'This Day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeFilter === 'This Week') {
      const day = now.getDay();
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeFilter === 'This Month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    let total = 0;
    let firstTime = 0;
    let returning = 0;

    data.forEach(c => {
      const lastVisitDate = c.lastVisit ? new Date(c.lastVisit) : null;
      const createdDate = c.createdAt ? new Date(c.createdAt) : null;

      // Check if the customer was active in the selected time range
      const isActiveInRange = (lastVisitDate && lastVisitDate >= startDate) || 
                              (createdDate && createdDate >= startDate);

      if (isActiveInRange) {
        total++;
        
        if ((c.totalVisits || 0) > 1) {
          returning++;
        } else {
          firstTime++;
        }
      }
    });

    setStats({
      total,
      new: firstTime,
      returning
    });
  }, [timeFilter]);

  // ✅ Load all customers
  const loadCustomers = useCallback(async () => {
    try {
      const q = query(collection(db, 'customers'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      
      setCustomers(list);
      setFiltered(list);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // ✅ Recalculate stats when timeFilter or customers change
  useEffect(() => {
    if (customers.length > 0) {
      calculateStats(customers);
    }
  }, [calculateStats, customers]);

  // ✅ Search, Filter & Sort Logic for the Table
  useEffect(() => {
    let result = [...customers];

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((c) =>
        c.referenceId?.toLowerCase().includes(term) ||
        c.firstName?.toLowerCase().includes(term) ||
        c.lastName?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
      );
    }

    if (balanceFilter === 'Has Balances') {
      result = result.filter((c) => (c.latestBalance || 0) > 0);
    } else if (balanceFilter === 'No Balance') {
      result = result.filter((c) => !c.latestBalance || c.latestBalance <= 0);
    }

    if (paymentFilter !== 'All Payments') {
      result = result.filter((c) => c.latestPaymentMethod === paymentFilter);
    }

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
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage customer profiles, visit history, prescriptions and payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ✅ The Time Filter */}
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white font-medium text-gray-700 outline-none shadow-sm cursor-pointer"
            >
              <option>This Day</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>

            <button
              onClick={() => setShowModal(true)}
              className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* ✅ Top Stat Cards (Only 3 now) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          {/* Total Served */}
          <div className="bg-[#dbeafe] rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-[#4A90E2] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">👥</div>
              <div>
                <p className="text-sm font-bold text-gray-800">Total Customers Served</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.total}</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Customers who visited this {timeFilter === 'This Day' ? 'day' : timeFilter === 'This Week' ? 'week' : 'month'}</p>
          </div>

          {/* First-time Visitors */}
          <div className="bg-[#f3e8ff] rounded-2xl p-5 border border-purple-200 shadow-sm relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-[#a855f7] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">👤</div>
              <div>
                <p className="text-sm font-bold text-gray-800">First-time Visitors</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.new}</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Customers visiting for the first time this {timeFilter === 'This Day' ? 'day' : timeFilter === 'This Week' ? 'week' : 'month'}</p>
          </div>

          {/* Returning Visitors */}
          <div className="bg-[#dcfce7] rounded-2xl p-5 border border-green-200 shadow-sm relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-[#22c55e] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">🔄</div>
              <div>
                <p className="text-sm font-bold text-gray-800">Returning Visitors</p>
                <h2 className="text-2xl font-bold text-gray-900">{stats.returning}</h2>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Existing customers who returned this {timeFilter === 'This Day' ? 'day' : timeFilter === 'This Week' ? 'week' : 'month'}</p>
          </div>

        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3 mb-4">
          
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by reference id, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="recent">Recent Visits</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Name (A-Z)</option>
          </select>

          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="All Payments">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Card">Card</option>
          </select>

          <select 
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="All Balances">All Balances</option>
            <option value="Has Balances">Only Unpaid</option>
            <option value="No Balance">Fully Paid</option>
          </select>

          <button onClick={clearFilters} className="text-sm text-[#4A90E2] hover:underline font-bold flex items-center gap-1 ml-auto px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Clear All Filters
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
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 p-4 mt-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                  className={`px-3 py-1.5 rounded-md text-sm border shadow-sm ${
                    currentPage === pageNum 
                      ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
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
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Next
          </button>
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