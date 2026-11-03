// src/pages/admin/SalesPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SalesChart from '../../components/SalesChart';
import { Link } from 'react-router-dom';
import TransactionDetailsModal from '../../components/TransactionDetailsModal'; // ✅ Import Modal

function SalesPage() {
  const [timeFilter, setTimeFilter] = useState('This Day');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null); // ✅ Modal State

  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedTransactions: 0,
    productsSold: 0,
    outstandingPayments: 0,
  });

  const [categories, setCategories] = useState([]);

  // Table Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All Payment Methods');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // ✅ Fetch from Firestore
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

  const filterSalesByRange = (data, range) => {
    const now = new Date();
    let startDate = new Date();

    if (range === 'This Day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'This Week') {
      const day = now.getDay();
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'This Month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'This Year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return data.filter((s) => new Date(s.orderDate) >= startDate);
  };

  useEffect(() => {
    if (sales.length === 0 && loading) return;

    const filtered = filterSalesByRange(sales, timeFilter);
    
    computeStats(filtered, sales); 
    computeCategories(filtered);
  }, [timeFilter, sales, loading]);

  const computeStats = (filteredData, allSalesData) => {
    const totalRevenue = filteredData.reduce((sum, s) => {
      const isPaymentReceipt = s.receiptNo?.startsWith('PAY-');
      return isPaymentReceipt ? sum : sum + (Number(s.totalAmount) || 0);
    }, 0);

    const completedTransactions = filteredData.filter(s => !s.receiptNo?.startsWith('PAY-')).length;

    const productsSold = filteredData.reduce(
      (sum, s) => sum + (s.items?.reduce((a, i) => a + (i.qty || 1), 0) || 0),
      0
    );

    const outstandingPayments = allSalesData.reduce((sum, s) => {
      const isPaymentReceipt = s.receiptNo?.startsWith('PAY-');
      if (!isPaymentReceipt) {
        return sum + (Number(s.balance) || 0);
      }
      return sum;
    }, 0);

    setStats({ 
      totalRevenue, 
      completedTransactions, 
      productsSold, 
      outstandingPayments
    });
  };

    const computeCategories = (data) => {
    // ✅ Hardcode the Frame Categories we care about
    const categoryMap = {
      'Plastic': 0,
      'Metal': 0,
      'Branded': 0,
      'Own Frame': 0,
      'Custom': 0
    };

    data.forEach((s) => {
      // We look at the first item (the frame) of the order
      const frameItem = s.items?.[0];
      if (frameItem) {
        const frameName = frameItem.name || frameItem.category;
        
        // Match the frame name to our categories
        if (categoryMap[frameName] !== undefined) {
          categoryMap[frameName] += (Number(s.totalAmount) || 0); // ✅ Use totalAmount instead of item price
        } else {
          // If it's something unexpected, add it to Custom
          categoryMap['Custom'] += (Number(s.totalAmount) || 0);
        }
      }
    });

    const total = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    
    // ✅ Palette for the 5 Frame Categories
    const palette = [
      '#818cf8', // Plastic - Indigo
      '#4A90E2', // Metal - Blue
      '#f87171', // Branded - Red
      '#fbbf24', // Own Frame - Yellow
      '#fb923c'  // Custom - Orange
    ];

    // Filter out empty categories (so the chart stays clean) and map colors
    const catArray = Object.entries(categoryMap)
      .filter(([name, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
        color: palette[idx % palette.length],
      }));

    setCategories(catArray);
  };

  const peso = (num) =>
    `₱ ${Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

  const buildDonut = () => {
    const circumference = 2 * Math.PI * 40;
    let offset = 0;
    return categories.map((cat, idx) => {
      const dash = (cat.percent / 100) * circumference;
      const el = (
        <circle
          key={idx}
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={cat.color}
          strokeWidth="20"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={`-${offset}`}
        />
      );
      offset += dash;
      return el;
    });
  };

  const rangeForChart = () => {
    if (timeFilter === 'This Day') return 'Today';
    if (timeFilter === 'This Week') return 'Week';
    if (timeFilter === 'This Month') return 'Month';
    return 'Year';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPaymentFilter('All Payment Methods');
    setStatusFilter('All Status');
  };

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

  const getTimeLabel = (isOutstanding = false) => {
    if (isOutstanding) return "Total unpaid balance across all sales";
    switch (timeFilter) {
      case 'This Day': return "Revenue generated today";
      case 'This Week': return "Revenue generated this week";
      case 'This Month': return "Revenue generated this month";
      case 'This Year': return "Revenue generated this year";
      default: return "Revenue generated";
    }
  };

  const getTransactionLabel = () => {
    switch (timeFilter) {
      case 'This Day': return "Successful transactions today";
      case 'This Week': return "Successful transactions this week";
      case 'This Month': return "Successful transactions this month";
      case 'This Year': return "Successful transactions this year";
      default: return "Successful transactions";
    }
  };

  const getProductsLabel = () => {
    switch (timeFilter) {
      case 'This Day': return "Items sold today";
      case 'This Week': return "Items sold this week";
      case 'This Month': return "Items sold this month";
      case 'This Year': return "Items sold this year";
      default: return "Items sold";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Overview</h1>
            <p className="text-gray-500 text-base mt-1">
              Track your clinic's sales performance and transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-base bg-white font-medium text-gray-700 outline-none shadow-sm cursor-pointer"
            >
              <option>This Day</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div className="bg-[#dbeafe] rounded-2xl p-5 border border-blue-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#818cf8] text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Revenue</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{peso(stats.totalRevenue)}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">{getTimeLabel()}</p>
          </div>

          <div className="bg-[#f3e8ff] rounded-2xl p-5 border border-purple-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#a855f7] text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Completed Transactions</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{stats.completedTransactions}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">{getTransactionLabel()}</p>
          </div>

          <div className="bg-[#dcfce7] rounded-2xl p-5 border border-green-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#22c55e] text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Products Sold</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{stats.productsSold}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">{getProductsLabel()}</p>
          </div>

          <div className="bg-[#fef3c7] rounded-2xl p-5 border border-yellow-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#eab308] text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Outstanding Payments</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{peso(stats.outstandingPayments)}</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">{getTimeLabel(true)}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Sales Trend</h2>
              <span className="text-sm font-medium text-gray-500">{timeFilter}</span>
            </div>
            <SalesChart orders={sales} range={rangeForChart()} width={400} height={200} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sales By Product Category</h2>
            
            <div className="flex-1 flex flex-row items-center justify-center gap-8">
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {buildDonut()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{peso(stats.totalRevenue)}</span>
                  <span className="text-xs text-gray-500">Total Sales</span>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-gray-700 font-medium">{cat.name}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-bold">{peso(cat.value)}</span>
                      <span className="text-gray-500 w-8 text-right font-medium">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white p-2 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by receipt no., customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <option value="All Payment Methods">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Card">Card</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <option value="All Status">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>

              <button 
                onClick={clearFilters}
                className="text-base text-[#4A90E2] hover:underline font-bold flex items-center gap-1 px-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Clear Filters
              </button>

              <Link to="/admin/transactions" className="text-base text-[#4A90E2] hover:underline font-bold ml-auto px-2">
                View All →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-[#dbeafe] text-gray-800 text-left">
                  <th className="px-6 py-4 font-bold">Receipt No.</th>
                  <th className="px-6 py-4 font-bold">Date & Time</th>
                  <th className="px-6 py-4 font-bold">Customer Name</th>
                  <th className="px-6 py-4 font-bold">Items</th>
                  <th className="px-6 py-4 font-bold">Total Amount</th>
                  <th className="px-6 py-4 font-bold">Payment</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500 text-base">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, 5).map((sale) => {
                    const isPartial = sale.balance > 0;
                    const statusText = sale.paymentStatus === 'paid' || !isPartial ? 'Paid' : 'Partial';

                    return (
                      // ✅ Clickable Row
                      <tr 
                        key={sale.id} 
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{sale.receiptNo || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          {sale.orderDate ? new Date(sale.orderDate).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '—'}
                        </td>
                        <td className="px-6 py-4 font-medium">{sale.customerName || '—'}</td>
                        <td className="px-6 py-4">{sale.items?.reduce((a, i) => a + (i.qty || 1), 0) || 1}</td>
                        <td className="px-6 py-4 font-bold">{peso(sale.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm font-bold ${
                            sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                            sale.paymentMethod === 'GCash' ? 'bg-blue-100 text-blue-700' : 
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {sale.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm font-bold ${
                            statusText === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {statusText}
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

      </div>

      {/* ✅ Transaction Details Modal */}
      <TransactionDetailsModal 
        sale={selectedSale} 
        onClose={() => setSelectedSale(null)} 
      />
    </div>
  );
}

export default SalesPage;