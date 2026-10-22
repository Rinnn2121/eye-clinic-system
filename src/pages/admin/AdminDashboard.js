// src/pages/admin/AdminDashboard.js

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SalesChart from '../../components/SalesChart';
import AddCustomerModal from './AddCustomerModal';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // State for real data
  const [stats, setStats] = useState({
    salesToday: 0,
    apptsToday: 0,
    customersToday: 0,
    pickupsToday: 0,
    totalCustomers: 0,
    returningCustomers: 0,
    newCustomersWeek: 0,
    pickedUpToday: 0,
    inProgress: 0,
    mostRequestedService: '—',
  });
  const [recentSales, setRecentSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 

  // Chart states
  const [chartRange, setChartRange] = useState('Week');

  // Modal state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // ✅ Fetch Data Function
  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // 1. CUSTOMERS
      const custSnap = await getDocs(collection(db, 'customers'));
      let newCustomersToday = 0;
      let totalCustomers = 0;
      let returningCustomers = 0;
      let newCustomersWeek = 0;

      custSnap.forEach((doc) => {
        const data = doc.data();
        totalCustomers++;
        if (data.createdAt) {
          const createdDate = new Date(data.createdAt);
          if (data.createdAt.startsWith(today)) newCustomersToday++;
          if (createdDate >= lastWeek) newCustomersWeek++;
        }
        if ((data.totalVisits || 0) > 1) returningCustomers++;
      });

      // 2. APPOINTMENTS
      const apptSnap = await getDocs(collection(db, 'appointments'));
      const allAppts = [];
      let apptsTodayCount = 0;

      apptSnap.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        allAppts.push(data);
        if (data.date === today) apptsTodayCount++;
      });

      const todaysAppts = allAppts
        .filter((a) => a.date === today)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      // 3. ORDERS / SALES
      const ordersRef = collection(db, 'orders');
      const allOrdersSnap = await getDocs(ordersRef);

      let salesTodayTotal = 0;
      let pickupsTodayCount = 0;
      let pickedUpTodayCount = 0;
      let inProgressCount = 0;

      allOrdersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.orderDate && data.orderDate.startsWith(today)) {
          salesTodayTotal += Number(data.totalAmount) || 0;
          if (data.pickupStatus === 'ready') pickupsTodayCount++;
          if (data.pickupStatus === 'picked_up') pickedUpTodayCount++;
          if (data.pickupStatus === 'in_progress') inProgressCount++;
        }
      });

      const rawOrders = [];
      allOrdersSnap.forEach((doc) => rawOrders.push({ id: doc.id, ...doc.data() }));
      setAllOrders(rawOrders);

      const qOrders = query(ordersRef, orderBy('orderDate', 'desc'), limit(5));
      const orderSnap = await getDocs(qOrders);
      const recentOrdersList = [];
      orderSnap.forEach((doc) => recentOrdersList.push({ id: doc.id, ...doc.data() }));

      // 4. INVENTORY
      const invSnap = await getDocs(collection(db, 'inventory'));
      const invList = [];
      invSnap.forEach((doc) => invList.push({ id: doc.id, ...doc.data() }));

      // 5. MOST REQUESTED SERVICE TODAY
      const serviceCount = {};
      allAppts.forEach((a) => {
        if (a.date === today && a.reason) {
          serviceCount[a.reason] = (serviceCount[a.reason] || 0) + 1;
        }
      });
      const mostRequested = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

      // UPDATE STATE
      setStats({
        salesToday: salesTodayTotal.toLocaleString(),
        apptsToday: apptsTodayCount,
        customersToday: newCustomersToday,
        pickupsToday: pickupsTodayCount,
        totalCustomers,
        returningCustomers,
        newCustomersWeek,
        pickedUpToday: pickedUpTodayCount,
        inProgress: inProgressCount,
        mostRequestedService: mostRequested ? mostRequested[0] : '—',
      });

      setAppointments(todaysAppts);
      setRecentSales(recentOrdersList);
      setInventoryList(invList.filter(i => i.isActive !== false).slice(0, 5));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredTotal = useMemo(() => {
    if (!allOrders.length) return 0;
    const now = new Date();
    let startDate = new Date();

    if (chartRange === 'Week') {
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (chartRange === 'Month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const total = allOrders.reduce((sum, order) => {
      if (!order.orderDate) return sum;
      const orderDate = new Date(order.orderDate);
      if (orderDate >= startDate) {
        return sum + (Number(order.totalAmount) || 0);
      }
      return sum;
    }, 0);

    return total;
  }, [allOrders, chartRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // Calendar Helpers
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER ROW */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Welcome back, Admin! ☀️
            </h1>
            <p className="text-gray-500 mt-1">Here's a quick look at today's optical activities.</p>
          </div>
          <div className="bg-[#dbeafe] text-blue-900 px-5 py-2 rounded-xl flex items-center gap-3 shadow-sm border border-blue-200">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-semibold text-sm">{new Date().toDateString()}</p>
              <p className="text-xs">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* TOP STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#e0e7ff] rounded-2xl p-5 relative border border-indigo-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#6366f1] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold">₱</div>
              <span className="text-sm font-medium text-gray-700">Sales</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">₱ {stats.salesToday}</h2>
            <p className="text-xs text-gray-500">Revenue generated today</p>
          </div>

          <div className="bg-[#f3e8ff] rounded-2xl p-5 relative border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#a855f7] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center">📅</div>
              <span className="text-sm font-medium text-gray-700">Appointments</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{stats.apptsToday}</h2>
            <p className="text-xs text-gray-500">Scheduled for today</p>
          </div>

          <div className="bg-[#dcfce7] rounded-2xl p-5 relative border border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#22c55e] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center">👥</div>
              <span className="text-sm font-medium text-gray-700">Customers</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{stats.customersToday}</h2>
            <p className="text-xs text-gray-500">Registered today</p>
          </div>

          <div className="bg-[#fef3c7] rounded-2xl p-5 relative border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#eab308] text-white rounded-full w-10 h-10 flex items-center justify-center">⏰</div>
              <span className="text-sm font-medium text-gray-700">Items for pick-up</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{stats.pickupsToday}</h2>
            <p className="text-xs text-gray-500">Ready for collection today</p>
          </div>
        </div>

        {/* MIDDLE ROW: Chart + Recent Sales + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">💸</span>
                  <h3 className="font-bold text-[#0035A8] text-lg">Sales Overview</h3>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl font-bold text-gray-900">₱ {filteredTotal.toLocaleString()}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    {chartRange === 'Week' ? 'This Week' : 'This Month'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Link to="/admin/sales" className="text-sm text-[#4A90E2] hover:underline font-medium">View Sales →</Link>
                <select 
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white shadow-sm outline-none cursor-pointer"
                >
                  <option value="Week">This Week</option>
                  <option value="Month">This Month</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <SalesChart orders={allOrders} range={chartRange} width={400} height={220} />
            </div>
          </div>

                    {/* Recent Sales */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#0035A8]">Recent Sales</h3>
              <Link to="/admin/sales" className="text-xs text-blue-600 hover:underline">View All →</Link>
            </div>
            
            <div className="flex-1 flex flex-col">
              <table className="w-full text-sm h-full">
                <thead>
                  <tr className="bg-[#0E62E8]/10 text-gray-500 text-left">
                    <th className="p-2 font-medium rounded-l-lg">Receipt no.</th>
                    <th className="p-2 font-medium">Amount</th>
                    <th className="p-2 font-medium rounded-r-lg">Payment</th>
                  </tr>
                </thead>
                <tbody className="flex-1">
                  {recentSales.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-gray-500">No sales yet</td></tr>
                  ) : (
                    /* ✅ Sliced to 5 items */
                    recentSales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 last:border-0">
                        <td className="p-2 text-gray-700">{sale.receiptNo}</td>
                        <td className="p-2 text-gray-900">₱{(sale.totalAmount || 0).toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                            sale.paymentMethod === 'Card' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col h-full relative">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">⚡</span> Quick Actions
            </h3>
            <div className="flex flex-col gap-3 flex-1">
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex-1 flex items-center justify-center w-full border border-green-200 bg-[#dcfce7]  text-green-900 rounded-xl font-bold text-sm hover:bg-[#4ade80] transition-colors shadow-sm"
              >
                + Add Customer
              </button>
              <Link to="/admin/appointments" className="flex-1 flex items-center justify-center w-full border border-pink-200 bg-[#ffe3fb] text-pink-900 rounded-xl font-bold text-sm hover:bg-[#f472b6] transition-colors shadow-sm">
                Set Up Appointment
              </Link>
              <Link to="/admin/inventory" className="flex-1 flex items-center justify-center w-full border border-yellow-200 bg-[#fcf0c8] text-yellow-900 rounded-xl font-bold text-sm hover:bg-[#fbbf24] transition-colors shadow-sm">
                Search Inventory
              </Link>
            </div>
          </div>
        </div>

                {/* ✅ BOTTOM SECTION: Restructured for exact alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SIDE: Appointments, Inventory, Customers (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Appointments Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#f3e8ff] p-5 border-b border-purple-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-[#8b5cf6] flex items-center gap-2">
                      <span className="text-2xl">📅</span> Appointments
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{stats.apptsToday} Appointments Today</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium">
                      Today • {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                    <Link to="/admin/appointments" className="text-sm text-[#4A90E2] hover:underline font-bold flex items-center gap-1">
                      View All <span className="text-xs">›</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white">
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No appointments scheduled for today.</p>
                ) : (
                  appointments.map((apt, idx) => (
                    <div key={idx} className={`flex items-center justify-between py-4 px-6 ${idx !== appointments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="w-1/4"><span className="font-semibold text-gray-800 text-sm">{apt.time}</span></div>
                      <div className="w-1/3"><span className="text-sm font-medium text-gray-700">{apt.customerName || 'Saavedra, Rudolf'}</span></div>
                      <div className="w-1/4"><span className="text-sm text-gray-500">{apt.reason || 'Eye Examination'}</span></div>
                      <div className="w-1/6 text-right flex items-center justify-end gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${apt.status === 'Confirmed' ? 'bg-green-500' : apt.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-bold ${apt.status === 'Confirmed' ? 'text-green-600' : apt.status === 'Pending' ? 'text-yellow-600' : 'text-red-500'}`}>{apt.status || 'Confirmed'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Row of Left Side: Inventory & Customers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1">
              
                             {/* Inventory */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-[#d97706] flex items-center gap-2">
                    <span className="text-xl">📦</span> Inventory <span className="text-xs font-normal text-gray-500">(Item List)</span>
                  </h3>
                  <Link to="/admin/inventory" className="text-xs text-[#4A90E2] hover:underline font-bold flex items-center gap-1">
                    View All <span className="text-xs">›</span>
                  </Link>
                </div>
                
                <div className="px-4 py-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#fef3c7] text-gray-800 text-left">
                        <th className="px-3 py-1.5 font-bold rounded-l-lg w-[35%]">Item</th>
                        <th className="px-3 py-1.5 font-bold w-[40%]">Description</th>
                        <th className="px-3 py-1.5 font-bold rounded-r-lg w-[25%]">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                          {/* Reduced py-3 to py-1.5 */}
                          <td className="px-3 py-1.5 flex items-center gap-3">
                            {/* Made the placeholder square smaller (w-6 h-6) */}
                            <div className="w-6 h-6 bg-gray-200 rounded-md flex-shrink-0"></div>
                            <span className="font-bold text-gray-800 text-xs truncate">{item.name}</span>
                          </td>
                          <td className="px-3 py-1.5 text-gray-500 text-xs truncate">
                            {item.description || (item.name.includes('Frame') ? 'Metal frame, black...' : 'Anti-reflective...')}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 text-xs font-medium truncate">{item.category}</td>
                        </tr>
                      ))}
                      {inventoryList.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-4 text-gray-400 text-xs">No items</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customers Overview */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-[#15803d] flex items-center gap-2">
                    <span className="text-xl">👥</span> Customers
                  </h3>
                  <Link to="/admin/customers" className="text-xs text-[#4A90E2] hover:underline font-bold flex items-center gap-1">
                    View All <span className="text-xs">→</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="bg-[#f3f4ff] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                  </div>
                  <div className="bg-[#fdf2f8] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-600">New</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stats.newCustomersWeek}</p>
                  </div>
                  <div className="bg-[#f0fdf4] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-600">Returning</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stats.returningCustomers}</p>
                  </div>
                  <div className="bg-[#fefce8] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-600">Top Service</p>
                    <p className="text-xs font-bold text-gray-900 mt-1 truncate">{stats.mostRequestedService}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE: Calendar & Items for Pick-up (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Calendar */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">📅</span> Calendar
                </h3>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <button className="text-gray-400 hover:text-gray-600 px-2">&lt;</button>
                <div className="flex gap-2">
                  <select className="border border-gray-200 rounded-md px-2 py-1 text-sm font-medium outline-none">
                    <option>{new Date().toLocaleString('default', { month: 'long' })}</option>
                  </select>
                  <select className="border border-gray-200 rounded-md px-2 py-1 text-sm font-medium outline-none">
                    <option>{new Date().getFullYear()}</option>
                  </select>
                </div>
                <button className="text-gray-400 hover:text-gray-600 px-2">&gt;</button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2 font-medium">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => <span key={d}>{d}</span>)}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1">
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} className="p-1"></div>
                ))}
                
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate();
                  const hasEvent = [10, 11, 16, 17, 18].includes(day); 
                  return (
                    <div key={i} className="flex flex-col items-center justify-center p-0.5">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      {hasEvent && <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-blue-600' : 'bg-blue-500'}`}></div>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 bg-[#dbeafe] text-blue-900 text-xs p-3 rounded-xl flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">●</span>
                <div>
                  <p className="font-bold mb-0.5">Incoming Schedule</p>
                  <p>You have {stats.apptsToday} appointments today.</p>
                </div>
              </div>
            </div>

            {/* ✅ Items for Pick-up (Compact & Stretches to align) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-black flex items-center gap-2">
                  <span className="text-xl">🕶️</span> Items for Pick-up
                </h3>
              </div>

              <div className="flex flex-col flex-1 gap-2">
                {/* Top Row */}
                <div className="grid grid-cols-2 gap-2 flex-[1.2]">
                  <div className="border border-blue-500 rounded-xl p-2 flex flex-col items-center justify-center bg-white">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="bg-[#e0f2fe] text-[#3b82f6] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✓</div>
                      <p className="text-[9px] font-bold text-[#3b82f6] leading-tight text-center">Ready for Pick-Up</p>
                    </div>
                    <p className="text-2xl font-bold text-[#3b82f6]">{stats.pickupsToday}</p>
                  </div>

                  <div className="border border-green-500 rounded-xl p-2 flex flex-col items-center justify-center bg-white">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="bg-[#dcfce7] text-[#22c55e] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✓</div>
                      <p className="text-[9px] font-bold text-[#22c55e] leading-tight text-center">Picked-Up Today</p>
                    </div>
                    <p className="text-2xl font-bold text-[#22c55e]">{stats.pickedUpToday}</p>
                  </div>
                </div>

                {/* Middle Row */}
                <div className="border border-yellow-500 rounded-xl p-2 flex flex-col items-center justify-center bg-white flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="bg-[#fef3c7] text-[#eab308] rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">⏱</div>
                    <p className="text-[9px] font-bold text-[#eab308]">In Preparation</p>
                  </div>
                  <p className="text-lg font-bold text-[#eab308]">{stats.inProgress}</p>
                </div>

                {/* Bottom Row */}
                <Link
                  to="/admin/sales"
                  className="bg-[#e5e7eb] rounded-xl p-2 flex items-center justify-center hover:bg-gray-300 transition-colors flex-1"
                >
                  <div className="flex items-center gap-2 text-gray-800">
                    <p className="text-[9px] font-bold uppercase leading-tight text-center">View Item<br/>Details</p>
                    <span className="text-base">→</span>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>

          
      </div>

      {/* ✅ Add Customer Modal */}
      {showAddCustomerModal && (
        <AddCustomerModal
          onClose={(startVisitWithId) => {
            setShowAddCustomerModal(false);
            if (startVisitWithId) {
              navigate(`/admin/patient-record/${startVisitWithId}`);
            }
          }}
          onCustomerCreated={() => {
            fetchDashboardData(); 
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;