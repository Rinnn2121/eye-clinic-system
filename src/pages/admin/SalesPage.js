// src/pages/admin/SalesPage.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SalesChart from '../../components/SalesChart';
import { Link } from 'react-router-dom';

function SalesPage() {
  const [timeFilter, setTimeFilter] = useState('This Day');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalSales: 0,
    productsSold: 0,
    totalCustomers: 0,
    bestSeller: { name: '—', count: 0, percent: 0 },
  });

  const [categories, setCategories] = useState([]);

  // ✅ New states for the Table Filters
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

  // ✅ Filter sales by time range (for the charts and top stats)
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

  // ✅ Recompute when filter or sales change
  useEffect(() => {
    if (sales.length === 0 && loading) return;

    const filtered = filterSalesByRange(sales, timeFilter);
    computeStats(filtered);
    computeCategories(filtered);
  }, [timeFilter, sales, loading]);

  // ✅ Stats
  const computeStats = (data) => {
    const totalSales = data.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const productsSold = data.reduce(
      (sum, s) => sum + (s.items?.reduce((a, i) => a + (i.qty || 1), 0) || 0),
      0
    );
    const uniqueCustomers = new Set(data.map((s) => s.customerEmail || s.customerName)).size;

    const productCount = {};
    data.forEach((s) => {
      s.items?.forEach((item) => {
        productCount[item.name] = (productCount[item.name] || 0) + (item.qty || 1);
      });
    });
    const bestEntry = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];
    const bestSeller = bestEntry
      ? {
          name: bestEntry[0],
          count: bestEntry[1],
          percent: productsSold > 0 ? Math.round((bestEntry[1] / productsSold) * 100) : 0,
        }
      : { name: '—', count: 0, percent: 0 };

    setStats({ totalSales, productsSold, totalCustomers: uniqueCustomers, bestSeller });
  };

  // ✅ Categories (for donut)
  const computeCategories = (data) => {
    const categoryMap = {};
    data.forEach((s) => {
      s.items?.forEach((item) => {
        const cat = item.category || 'Other';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += (item.price || 0) * (item.qty || 1);
      });
    });

    const total = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    const palette = ['#818cf8', '#4A90E2', '#f87171', '#fbbf24', '#fb923c'];
    const catArray = Object.entries(categoryMap).map(([name, value], idx) => ({
      name,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
      color: palette[idx % palette.length],
    }));

    setCategories(catArray);
  };

  // ✅ Peso formatter
  const peso = (num) =>
    `₱ ${Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

  // ✅ Donut builder
  const circumference = 2 * Math.PI * 40;
  const buildDonut = () => {
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

  // ✅ Map dropdown to SalesChart range
  const rangeForChart = () => {
    if (timeFilter === 'This Day') return 'Today';
    if (timeFilter === 'This Week') return 'Week';
    if (timeFilter === 'This Month') return 'Month';
    return 'Year';
  };

  // ✅ Filter the table data based on Search, Payment, and Status
  const filteredTransactions = sales.filter((sale) => {
    const matchesSearch = 
      (sale.receiptNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (sale.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesPayment = paymentFilter === 'All Payment Methods' || sale.paymentMethod === paymentFilter;
    
    // Treat undefined paymentStatus as 'Pending' or 'Partial' if they have a balance
    const currentStatus = sale.paymentStatus || (sale.balance > 0 ? 'Partial' : 'Paid');
    const matchesStatus = statusFilter === 'All Status' || 
      currentStatus.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'Paid' && sale.balance <= 0) ||
      (statusFilter === 'Partial' && sale.balance > 0);

    return matchesSearch && matchesPayment && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Overview</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your clinic's sales performance and transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option>This Day</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <button className="bg-[#4A90E2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90">
              Export Report
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sales', value: peso(stats.totalSales), bg: 'bg-indigo-100 border border-indigo-200', iconBg: 'bg-indigo-500' },
            { label: 'Products Sold', value: stats.productsSold, bg: 'bg-purple-100 border border-purple-200', iconBg: 'bg-purple-500' },
            { label: 'Total Customers', value: stats.totalCustomers, bg: 'bg-green-100 border border-green-200', iconBg: 'bg-green-500' },
            {
              label: 'Best Seller / Popular',
              value: stats.bestSeller.name,
              bg: 'bg-yellow-100 border border-yellow-200',
              iconBg: 'bg-yellow-500',
              sub: `${stats.bestSeller.count} sold (${stats.bestSeller.percent}% of total)`,
            },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.iconBg} rounded-full w-8 h-8`}></div>
                <span className="text-sm text-gray-700 font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1 truncate">{stat.value}</div>
              {stat.sub && <div className="text-xs text-gray-600">{stat.sub}</div>}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sales Trend</h2>
              <span className="text-xs text-gray-500">{timeFilter}</span>
            </div>
            <SalesChart orders={sales} range={rangeForChart()} width={400} height={200} />
          </div>

          {/* Sales By Product Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales By Product Category</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {buildDonut()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold">{peso(stats.totalSales)}</span>
                  <span className="text-xs text-gray-500">Total Sales</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-medium">{peso(cat.value)}</span>
                      <span className="text-gray-500 w-8 text-right">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No data</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Recent Transactions Table with Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Table Header & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by receipt no., customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none"
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none"
              >
                <option value="All Status">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>

              <Link to="/admin/transactions" className="text-sm text-[#4A90E2] hover:underline font-medium ml-auto md:ml-2">
                View All →
              </Link>
            </div>
          </div>

          {/* Table Content */}
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
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  /* ✅ Added .slice(0, 5) here to limit to 5 entries */
                  filteredTransactions.slice(0, 5).map((sale) => {
                    const isPartial = sale.balance > 0;
                    const statusText = sale.paymentStatus === 'paid' || !isPartial ? 'Paid' : 'Partial';

                    return (
                      <tr key={sale.id} className="hover:bg-gray-50 text-gray-700">
                        <td className="px-6 py-4">{sale.receiptNo || '—'}</td>
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

      </div>
    </div>
  );
}

export default SalesPage;