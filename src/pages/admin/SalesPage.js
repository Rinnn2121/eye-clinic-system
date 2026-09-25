import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
  const [weeklyData, setWeeklyData] = useState([]);

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

  // ✅ Filter sales by range
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

  // ✅ Recalculate on filter change
  useEffect(() => {
    if (sales.length === 0 && loading) return;

    const filtered = filterSalesByRange(sales, timeFilter);
    computeStats(filtered);
    computeCategories(filtered);
    computeWeekly(filtered);
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

  // ✅ Categories
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

  // ✅ Weekly
  const computeWeekly = (data) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    data.forEach((s) => {
      const d = new Date(s.orderDate);
      if (d >= sevenDaysAgo) {
        const dayName = days[d.getDay()];
        weekTotals[dayName] += s.totalAmount || 0;
      }
    });

    setWeeklyData(Object.entries(weekTotals).map(([day, total]) => ({ day, total })));
  };

  // ✅ Peso
  const peso = (num) =>
    `₱ ${Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

  // ✅ Path
  const buildPath = () => {
    if (weeklyData.length === 0) return '';
    const max = Math.max(...weeklyData.map((d) => d.total), 1);
    const points = weeklyData.map((d, i) => {
      const x = 55 + i * 52;
      const y = 155 - (d.total / max) * 130;
      return `${x} ${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // ✅ Donut
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
            { label: 'Total Sales', value: peso(stats.totalSales), bg: 'bg-indigo-100', iconBg: 'bg-indigo-500' },
            { label: 'Products Sold', value: stats.productsSold, bg: 'bg-purple-100', iconBg: 'bg-purple-500' },
            { label: 'Total Customers', value: stats.totalCustomers, bg: 'bg-green-100', iconBg: 'bg-green-500' },
            {
              label: 'Best Seller / Popular',
              value: stats.bestSeller.name,
              bg: 'bg-yellow-100',
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
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h2>
            <svg viewBox="0 0 400 180" className="w-full h-44">
              {[15, 50, 85, 120, 155].map((y, i) => (
                <line key={i} x1="50" y1={y} x2="390" y2={y} stroke="#f3f4f6" />
              ))}
              <path d={buildPath()} fill="none" stroke="#93c5fd" strokeWidth="2" />
              {weeklyData.map((d, i) => {
                const max = Math.max(...weeklyData.map((x) => x.total), 1);
                const x = 55 + i * 52;
                const y = 155 - (d.total / max) * 130;
                return <circle key={i} cx={x} cy={y} r="3" fill="#4A90E2" />;
              })}
              {weeklyData.map((d, i) => (
                <text key={i} x={60 + i * 52} y="178" fontSize="10" fill="#9ca3af">
                  {d.day}
                </text>
              ))}
            </svg>
          </div>

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

        {/* Recent Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
            <button className="text-sm text-[#4A90E2] hover:underline">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#dbeafe] text-gray-800">
                  <th className="text-left px-6 py-3">Date &amp; Time</th>
                  <th className="text-left px-6 py-3">Receipt No.</th>
                  <th className="text-left px-6 py-3">Customer Name</th>
                  <th className="text-left px-6 py-3">Items</th>
                  <th className="text-left px-6 py-3">Total Amount</th>
                  <th className="text-left px-6 py-3">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(sale.orderDate).toLocaleString('en-PH')}
                    </td>
                    <td className="px-6 py-4">{sale.receiptNo}</td>
                    <td className="px-6 py-4">{sale.customerName}</td>
                    <td className="px-6 py-4">
                      {sale.items?.reduce((a, i) => a + (i.qty || 1), 0)} item(s)
                    </td>
                    <td className="px-6 py-4 font-medium">{peso(sale.totalAmount)}</td>
                    <td className="px-6 py-4">{sale.paymentMethod}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No sales data yet
                    </td>
                  </tr>
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