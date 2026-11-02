// src/pages/admin/AdminDashboard.js

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import SalesChart from '../../components/SalesChart';
import AddCustomerModal from './AddCustomerModal';
import QuickServiceInvoiceModal from '../../components/QuickServiceInvoiceModal';
import QuickInventoryModal from '../../components/QuickInventoryModal';
import AppointmentWizardModal from '../../components/AppointmentWizardModal';
import ConfirmModal from '../../components/ConfirmModal';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import ProductModal from '../../components/ProductModal';

function AdminDashboard() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);

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

  const [selectedDate, setSelectedDate] = useState(new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  const [chartRange, setChartRange] = useState('Week');

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedProductToView, setSelectedProductToView] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const today = new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

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

      const apptSnap = await getDocs(collection(db, 'appointments'));
      const allAppts = [];
      let apptsTodayCount = 0;

      apptSnap.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        allAppts.push(data);
        if (data.date === today) apptsTodayCount++;
      });

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

      const invSnap = await getDocs(collection(db, 'inventory'));
      const invList = [];
      invSnap.forEach((doc) => invList.push({ id: doc.id, ...doc.data() }));

      const serviceCount = {};
      allAppts.forEach((a) => {
        if (a.date === today && a.reason) {
          serviceCount[a.reason] = (serviceCount[a.reason] || 0) + 1;
        }
      });
      const mostRequested = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

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

      setAppointments(allAppts);
      setRecentSales(recentOrdersList);
      setInventoryList(invList.filter(i => i.isActive !== false));

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

    return allOrders.reduce((sum, order) => {
      if (!order.orderDate) return sum;
      const orderDate = new Date(order.orderDate);
      if (orderDate >= startDate) {
        return sum + (Number(order.totalAmount) || 0);
      }
      return sum;
    }, 0);
  }, [allOrders, chartRange]);

  const selectedDateAppts = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .map(a => ({
        ...a,
        displayTime: a.time
          ? new Date(`2000-01-01T${a.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : ''
      }));
  }, [appointments, selectedDate]);

  const todaysAppts = useMemo(() => {
    const today = new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const filtered = appointments.filter(a => a.date === today);

    return filtered.sort((a, b) => {
      const getStatusWeight = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending' || s === 'scheduled') return 1;
        if (s === 'completed') return 2;
        if (s === 'cancelled') return 3;
        return 4;
      };
      const weightA = getStatusWeight(a.status);
      const weightB = getStatusWeight(b.status);
      if (weightA !== weightB) return weightA - weightB;
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return weightA === 1 ? dateA - dateB : dateB - dateA;
    });
  }, [appointments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="w-full mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userRole === 'admin' ? 'Admin' : 'Staff'}!
            </h1>
            <p className="text-gray-500 text-base mt-1">Here's a quick look at today's optical activities.</p>
          </div>
          <div className="bg-[#dbeafe] text-blue-900 px-5 py-2 rounded-xl flex items-center gap-3 shadow-sm border border-blue-200">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-semibold text-sm">{new Date().toDateString()}</p>
              <p className="text-xs">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* TOP STAT CARDS — Bigger fonts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userRole === 'admin' && (
            <div className="bg-[#e0e7ff] rounded-2xl p-5 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#6366f1] text-white p-2 rounded-full w-11 h-11 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-700">Sales</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">₱ {stats.salesToday}</h2>
              <p className="text-sm text-gray-500">Revenue generated today</p>
            </div>
          )}

          <div className="bg-[#f3e8ff] rounded-2xl p-5 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#a855f7] text-white p-2 rounded-full w-11 h-11 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Appointments</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.apptsToday}</h2>
            <p className="text-sm text-gray-500">Scheduled for today</p>
          </div>

          <div className="bg-[#dcfce7] rounded-2xl p-5 border border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#22c55e] text-white p-2 rounded-full w-11 h-11 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Customers</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.customersToday}</h2>
            <p className="text-sm text-gray-500">Registered today</p>
          </div>

          <div className="bg-[#fef3c7] rounded-2xl p-5 border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#eab308] text-white rounded-full w-11 h-11 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Items for pick-up</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.pickupsToday}</h2>
            <p className="text-sm text-gray-500">Ready for collection today</p>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {userRole === 'admin' && (
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-[#0035A8] text-xl">Sales Overview</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold text-gray-900">₱ {filteredTotal.toLocaleString()}</span>
                    <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-1 rounded-md">
                      {chartRange === 'Week' ? 'This Week' : 'This Month'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Link to="/admin/sales" className="text-sm text-[#4A90E2] hover:underline font-medium">View Sales →</Link>
                  <select
                    value={chartRange}
                    onChange={(e) => setChartRange(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white shadow-sm outline-none cursor-pointer"
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
          )}

          {userRole === 'admin' && (
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#0035A8] text-xl">Recent Sales</h3>
                <Link to="/admin/sales" className="text-sm text-blue-600 hover:underline font-medium">View All →</Link>
              </div>

              <div className="flex-1">
                <table className="w-full text-base table-fixed h-full">
  <thead>
    <tr className="bg-[#0E62E8]/10 text-gray-600 text-left">
      <th className="w-[40%] px-3 py-2 font-semibold rounded-l-lg">Receipt no.</th>
      <th className="w-[30%] px-3 py-2 font-semibold">Amount</th>
      <th className="w-[30%] px-3 py-2 font-semibold rounded-r-lg text-center">Payment</th>
    </tr>
  </thead>
  <tbody>
    {recentSales.length === 0 ? (
      <tr><td colSpan="3" className="p-4 text-center text-gray-500">No sales yet</td></tr>
    ) : (
      recentSales.slice(0, 5).map((sale) => (
        <tr key={sale.id} className="border-b border-gray-100 last:border-0">
          <td className="px-3 py-3 text-gray-700 font-medium truncate">{sale.receiptNo}</td>
          <td className="px-3 py-3 text-gray-900 font-semibold whitespace-nowrap">₱{(sale.totalAmount || 0).toLocaleString()}</td>
          <td className="px-3 py-3 text-center">
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
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
          )}

          {/* Quick Actions */}
          <div className={`${userRole === 'admin' ? 'lg:col-span-3' : 'lg:col-span-12'} bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col`}>
            <h3 className="font-bold text-gray-900 text-xl mb-4">Quick Actions</h3>
            <div className={`flex gap-3 flex-1 ${userRole === 'admin' ? 'flex-col' : 'flex-col md:flex-row'}`}>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex-1 flex items-center justify-center w-full border border-green-200 bg-[#dcfce7] text-green-900 rounded-xl font-bold text-base hover:bg-[#4ade80] transition-colors shadow-sm min-h-[56px]"
              >
                + Add Customer
              </button>
              <button
                onClick={() => setShowServiceModal(true)}
                className="flex-1 flex items-center justify-center w-full border border-blue-200 bg-[#dbeafe] text-blue-900 rounded-xl font-bold text-base hover:bg-[#93c5fd] transition-colors shadow-sm min-h-[56px]"
              >
                Service Invoice
              </button>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="flex-1 flex items-center justify-center w-full border border-pink-200 bg-[#ffe3fb] text-pink-900 rounded-xl font-bold text-base hover:bg-[#f472b6] transition-colors shadow-sm min-h-[56px]"
              >
                Set Up Appointment
              </button>
                            <button 
                onClick={() => setShowInventoryModal(true)}
                className="flex-1 flex items-center justify-center w-full border border-yellow-200 bg-[#fcf0c8] text-yellow-900 rounded-xl font-bold text-base hover:bg-[#fbbf24] transition-colors shadow-sm min-h-[56px]"
              >
                Search Catalog
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Appointments Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#f3e8ff] p-5 border-b border-purple-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-2xl text-[#8b5cf6]">Appointments</h3>
                    <p className="text-sm text-gray-600 mt-1 font-medium">{stats.apptsToday} Appointments Today</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium">
                      Today • {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                    <Link to="/admin/appointments" className="text-sm text-[#4A90E2] hover:underline font-bold flex items-center gap-1">
                      View All ›
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white min-h-[320px] ">
                {todaysAppts.length === 0 ? (
  <div className="flex items-center justify-center py-8">
    <p className="text-gray-500 text-base py-8 text-center">No appointments scheduled for today.</p>
  </div>
) : (
  todaysAppts.map((apt, idx) => (
    <div
      key={idx}
      onClick={() => setSelectedAppointment(apt)}
      className={`flex items-center justify-between py-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors ${
        idx !== todaysAppts.length - 1 ? 'border-b border-gray-100' : ''
      }`}
    >
      <div className="w-1/5 flex-shrink-0">
        <span className="font-semibold text-gray-800 text-base">
          {apt.time ? new Date(`2000-01-01T${apt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
        </span>
      </div>
      <div className="w-1/3 min-w-0 pr-3">
        <span className="text-base font-medium text-gray-700 truncate block">{apt.customerName || 'Walk-in'}</span>
      </div>
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-base text-gray-500 truncate block">{apt.reason || 'Eye Examination'}</span>
      </div>
      <div className="w-[15%] flex-shrink-0 text-right flex items-center justify-end gap-2">
        <span className={`w-2 h-2 rounded-full ${
          apt.status === 'Completed' ? 'bg-green-500' :
          apt.status === 'Cancelled' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></span>
        <span className={`text-sm font-bold ${
          apt.status === 'Completed' ? 'text-green-600' :
          apt.status === 'Cancelled' ? 'text-red-500' : 'text-yellow-600'
        }`}>
          {apt.status || 'Pending'}
        </span>
      </div>
    </div>
  ))
)}
              </div>
            </div>

            {/* Inventory & Customers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Catalog */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-[#d97706] flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Catalog
                  </h3>
                  <Link to="/admin/catalog" className="text-xs text-[#4A90E2] hover:underline font-bold flex items-center gap-1">
                    View All <span className="text-xs">›</span>
                  </Link>
                </div>
                <div className="px-4 py-2 flex-1">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="bg-[#fef3c7] text-gray-800 text-left">
                        <th className="px-3 py-2 font-bold rounded-l-lg">Item</th>
                        <th className="px-3 py-2 font-bold rounded-r-lg">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2 font-bold text-gray-800 truncate">{item.name}</td>
                          <td className="px-3 py-2 text-gray-600 font-medium truncate">{item.category}</td>
                        </tr>
                      ))}
                      {inventoryList.length === 0 && (
                        <tr><td colSpan="2" className="text-center py-4 text-gray-400">No items</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customers */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl text-[#15803d]">Customers</h3>
                  <Link to="/admin/customers" className="text-sm text-[#4A90E2] hover:underline font-bold">
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="bg-[#f3f4ff] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-sm font-bold text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                  </div>
                  <div className="bg-[#fdf2f8] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-sm font-bold text-gray-600">New</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.newCustomersWeek}</p>
                  </div>
                  <div className="bg-[#f0fdf4] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-sm font-bold text-gray-600">Returning</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.returningCustomers}</p>
                  </div>
                  <div className="bg-[#fefce8] p-3 rounded-xl flex flex-col justify-between">
                    <p className="text-sm font-bold text-gray-600">Top Service</p>
                    <p className="text-sm font-bold text-gray-900 mt-1 truncate">{stats.mostRequestedService}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Calendar & Pickups */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-gray-800">Calendar</h3>
              </div>
              <div className="flex justify-between items-center mb-4">
                <button className="text-gray-400 hover:text-gray-600 px-2 text-lg">&lt;</button>
                <div className="flex gap-2">
                  <select className="border border-gray-200 rounded-md px-2 py-1 text-sm font-medium outline-none">
                    <option>{new Date().toLocaleString('default', { month: 'long' })}</option>
                  </select>
                  <select className="border border-gray-200 rounded-md px-2 py-1 text-sm font-medium outline-none">
                    <option>{new Date().getFullYear()}</option>
                  </select>
                </div>
                <button className="text-gray-400 hover:text-gray-600 px-2 text-lg">&gt;</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2 font-semibold">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => <span key={d}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-base">
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} className="p-1"></div>
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = day === new Date().getDate();
                  const isSelected = selectedDate === formattedDate;
                  const hasAppointments = appointments.some(a => a.date === formattedDate);

                  return (
                    <div key={i} className="flex flex-col items-center justify-center p-0.5">
                      <button
                        onClick={() => setSelectedDate(formattedDate)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors font-medium ${
                          isSelected ? 'bg-blue-600 text-white font-bold' :
                          isToday ? 'bg-blue-100 text-blue-600 font-bold' :
                          'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${
                        hasAppointments ? (isSelected ? 'bg-blue-600' : 'bg-blue-500') : 'bg-transparent'
                      }`}></div>
                    </div>
                  );
                })}
              </div>

              {/* Incoming Schedule */}
              <div className="mt-4 bg-[#dbeafe] text-blue-900 text-sm p-3 rounded-xl">
                <div className="flex justify-between items-center font-bold mb-2">
                  <span>Incoming Schedule</span>
                  <span>{new Date(selectedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                </div>
                {selectedDateAppts.length === 0 ? (
                  <p className="text-blue-700/70 italic">No appointments scheduled.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[72px] overflow-y-auto pr-1">
                    {selectedDateAppts.map((apt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-semibold whitespace-nowrap">{apt.displayTime}</span>
                        <span className="truncate">{apt.customerName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items for Pick-up */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col">
              <h3 className="font-bold text-xl text-gray-900 mb-4">Items for Pick-up</h3>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-blue-500 rounded-xl p-3 flex flex-col items-center justify-center bg-white">
                    <p className="text-xs font-bold text-[#3b82f6] leading-tight text-center mb-1">Ready for Pick-Up</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">{stats.pickupsToday}</p>
                  </div>
                  <div className="border border-green-500 rounded-xl p-3 flex flex-col items-center justify-center bg-white">
                    <p className="text-xs font-bold text-[#22c55e] leading-tight text-center mb-1">Picked-Up Today</p>
                    <p className="text-2xl font-bold text-[#22c55e]">{stats.pickedUpToday}</p>
                  </div>
                </div>
                <div className="border border-yellow-500 rounded-xl p-3 flex flex-col items-center justify-center bg-white">
                  <p className="text-xs font-bold text-[#eab308] mb-1">In Preparation</p>
                  <p className="text-2xl font-bold text-[#eab308]">{stats.inProgress}</p>
                </div>
                                <Link
                  to="/admin/sales"
                  className="bg-[#e5e7eb] rounded-xl p-3 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2 text-gray-800">
                    <p className="text-sm font-bold uppercase leading-tight text-center">View Item Details</p>
                    <span className="text-lg">→</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ✅ Modals */}
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
            setAlertConfig({ type: 'success', title: 'Customer Added', message: 'The new customer has been added successfully.' });
          }}
        />
      )}

      {showServiceModal && (
        <QuickServiceInvoiceModal
          onClose={() => setShowServiceModal(false)}
          onSuccess={() => {
            fetchDashboardData();
            setAlertConfig({ type: 'success', title: 'Receipt Issued!', message: 'The service invoice has been saved successfully.' });
          }}
        />
      )}

      {showAppointmentModal && (
        <AppointmentWizardModal
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            fetchDashboardData();
            setAlertConfig({ type: 'success', title: 'Appointment Scheduled', message: 'The appointment was added successfully.' });
          }}
        />
      )}

      {showInventoryModal && (
        <QuickInventoryModal
          onClose={() => setShowInventoryModal(false)}
          inventoryList={inventoryList}
        />
      )}

      {/* ✅ Appointment Details Modal */}
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />

              {showInventoryModal && (
        <QuickInventoryModal 
          onClose={() => setShowInventoryModal(false)} 
          inventoryList={inventoryList} 
          onItemClick={(item) => {
            setShowInventoryModal(false); // Close search
            setSelectedProductToView(item); // Open details
          }}
        />
      )}

      {/* ✅ Render the Product Modal for viewing/editing */}
      {selectedProductToView && (
        <ProductModal 
          product={selectedProductToView} 
          onClose={() => setSelectedProductToView(null)} 
          onSuccess={fetchDashboardData} // Refresh dashboard stats if a change was made
        />
      )}

      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          iconType={alertConfig.type === 'success' ? 'success' : 'error'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => setAlertConfig(null)}
        />
      )}

    </div>
  );
}

export default AdminDashboard;