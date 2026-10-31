// src/pages/admin/AllTransactionsPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';

function AllTransactionsPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All Payment Methods');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedSale, setSelectedSale] = useState(null);

    // ✅ Clear Filters Function
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentFilter('All Payment Methods');
    setStatusFilter('All Status');
  };
  
  // Pagination (Mockup for now)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('orderDate', 'desc'));
        const snapshot = await getDocs(q);

        const allSales = [];
        snapshot.forEach((doc) => {
          allSales.push({ id: doc.id, ...doc.data() });
        });

        setSales(allSales);
        setLoading(false);
      } catch (error) {
        console.error('Error loading sales:', error);
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Peso formatter
  const peso = (num) =>
    `₱ ${Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

  // Filter Logic
  const filteredTransactions = sales.filter((sale) => {
    const matchesSearch = 
      (sale.receiptNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sale.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesPayment = paymentFilter === 'All Payment Methods' || sale.paymentMethod === paymentFilter;
    
    const currentStatus = sale.paymentStatus || (sale.balance > 0 ? 'Partial' : 'Paid');
    const matchesStatus = statusFilter === 'All Status' || 
      currentStatus.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'Paid' && sale.balance <= 0) ||
      (statusFilter === 'Partial' && sale.balance > 0);

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        
                {/* ✅ Combined Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          
          {/* Left Side: Back Link & Title */}
          <div className="flex flex-col gap-1">
            <Link to="/admin/sales" 
            className="text-sm text-[#4A90E2] flex items-center gap-1 font-bold transition-colors mb-2 w-fit">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sales
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          </div>

          {/* Right Side: Date Range & Export Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
              <span>📅</span> Date Range <span className="text-xs text-gray-400">▼</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 shadow-sm">
              <span>⬇</span> Export Sales
            </button>
          </div>

        </div>

                {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3 mb-6">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search by receipt no., customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
            />
          </div>
          
          {/* Payment Filter */}
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="All Payment Methods">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Card">Card</option>
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="All Status">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
          </select>

          {/* Clear Filters */}
          <button 
            onClick={clearFilters}
            className="text-sm text-[#4A90E2] hover:underline font-bold flex items-center gap-1 px-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Clear All Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#dbeafe] text-gray-800 text-left">
                  <th className="px-6 py-4 font-semibold">Receipt No.</th>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Customer Name</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold">Total Amount</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((sale) => {
                    const isPartial = sale.balance > 0;
                    const statusText = sale.paymentStatus === 'paid' || !isPartial ? 'Paid' : 'Partial';

                    return (
                      /* ✅ Added onClick and cursor-pointer class here */
                      <tr 
                        key={sale.id} 
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-[#4A90E2]">{sale.receiptNo || '—'}</td>
                        <td className="px-6 py-4 text-xs">
                          {sale.orderDate ? new Date(sale.orderDate).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '—'}
                        </td>
                        <td className="px-6 py-4">{sale.customerName || '—'}</td>
                        <td className="px-6 py-4">{sale.items?.reduce((a, i) => a + (i.qty || 1), 0) || 1}</td>
                        <td className="px-6 py-4 font-medium">{peso(sale.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                            sale.paymentMethod === 'GCash' ? 'bg-blue-100 text-blue-700' : 
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {sale.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            statusText === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            ● {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Only show up to 5 page numbers for clean UI
              if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                 if (pageNum === 3) return <span key={pageNum} className="px-2 py-1 text-gray-400">...</span>;
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
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>

      </div>
      {/* ✅ Transaction Details Modal */}
      <TransactionDetailsModal 
        sale={selectedSale} 
        onClose={() => setSelectedSale(null)} 
      />
    </div>
  );
}

export default AllTransactionsPage;