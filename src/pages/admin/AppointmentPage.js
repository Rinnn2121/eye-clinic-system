// src/pages/admin/AppointmentPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import AddCustomerModal from './AddCustomerModal';

function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [, setLoading] = useState(true);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Service');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // ✅ Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0]);

  // ✅ Modal States for the 4-Step Wizard
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1, 2, 3, 4
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [allCustomers, setAllCustomers] = useState([]); // For Step 2 search

  // Form State
  const [newAppointment, setNewAppointment] = useState({
    date: new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0],
    time: '09:00',
    reason: 'Eye Examination',
    note: ''
  });

  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ✅ Load Data
  const loadAppointments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'appointments'));
      const items = [];
      querySnapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

      const now = new Date();
      const todayStr = new Date(now.getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().slice(0, 5);

      const updatedItems = await Promise.all(items.map(async (apt) => {
        const statusLower = (apt.status || '').toLowerCase();
        if (statusLower === 'pending' || statusLower === 'scheduled') {
          const isPastDate = apt.date < todayStr;
          const isTodayButPastTime = apt.date === todayStr && apt.time < currentTimeStr;

          if (isPastDate || isTodayButPastTime) {
            await updateDoc(doc(db, 'appointments', apt.id), { status: 'Cancelled' });
            return { ...apt, status: 'Cancelled' };
          }
        }
        return apt;
      }));

      const sorted = updatedItems.sort((a, b) => {
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
        if (weightA === 1) return dateA - dateB; 
        return dateB - dateA; 
      });

      setAppointments(sorted);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // ✅ Fetch customers for Step 2
  useEffect(() => {
    if (modalStep === 2) {
      const fetchCustomers = async () => {
        const snap = await getDocs(collection(db, 'customers'));
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setAllCustomers(list);
      };
      fetchCustomers();
    }
  }, [modalStep]);

  // ✅ Handle Submit
  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      
      setIsModalOpen(false);
      setSuccessMsg(true);
      loadAppointments();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // ✅ Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
    const dateAppts = appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return { total, completed, cancelled, dateAppts };
  }, [appointments, selectedDate]);

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => a.customerName?.toLowerCase().includes(lower) || a.phone?.includes(lower));
    }
    if (serviceFilter !== 'All Service') result = result.filter(a => a.reason === serviceFilter);
    if (statusFilter !== 'All Status') result = result.filter(a => a.status === statusFilter);
    return result;
  }, [appointments, searchTerm, serviceFilter, statusFilter]);

  // Calendar Helpers
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER ROW */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and monitor your clinic's upcoming and scheduled appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white font-medium text-gray-700 outline-none shadow-sm cursor-pointer">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setModalStep(1); // Start at step 1
                setIsModalOpen(true);
              }}
              className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + New Appointment
            </button>
          </div>
        </div>

        {/* TOP STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#dbeafe] rounded-2xl p-5 relative border border-blue-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#4A90E2] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">📅</div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Appointments</p>
              <h2 className="text-2xl font-bold text-gray-900">{stats.total}</h2>
            </div>
          </div>
          <div className="bg-[#dcfce7] rounded-2xl p-5 relative border border-green-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#22c55e] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">✅</div>
            <div>
              <p className="text-sm font-medium text-gray-700">Completed Appointments</p>
              <h2 className="text-2xl font-bold text-gray-900">{stats.completed}</h2>
            </div>
          </div>
          <div className="bg-[#fee2e2] rounded-2xl p-5 relative border border-red-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#ef4444] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner">✖️</div>
            <div>
              <p className="text-sm font-medium text-gray-700">Cancelled/No-Show</p>
              <h2 className="text-2xl font-bold text-gray-900">{stats.cancelled}</h2>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 mr-32 min-w-[200px]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by customer name, phone no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90E2] outline-none text-sm placeholder-gray-500"
                />
              </div>
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none">
                <option value="All Service">All Service</option>
                <option value="Eye Examination">Eye Examination</option>
                <option value="Dry Eye Test">Dry Eye Test</option>
                <option value="Color Vision Test">Color Vision Test</option>
                <option value="Contact Lens Fitting">Contact Lens Fitting</option>
                <option value="Prescribing">Prescribing</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-600 outline-none">
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Link to="/admin/all-appointments" className="text-sm text-[#4A90E2] hover:underline font-bold ml-auto">
                View All →
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm h-full">
                  <thead>
                    <tr className="bg-[#dbeafe] text-gray-600 text-left border-b border-gray-200">
                      <th className="px-5 py-3 font-semibold">Date & Time</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Service</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAppointments.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-gray-500">No appointments found.</td></tr>
                    ) : (
                      filteredAppointments.slice(0, 5).map((apt) => (
                        <tr key={apt.id} className="hover:bg-gray-50 text-gray-700">
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-800">
                              {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-500">{apt.time}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium">{apt.customerName || 'Walk-in'}</div>
                            <div className="text-xs text-gray-500">{apt.phone || 'N/A'}</div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{apt.reason}</td>
                          <td className="px-5 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              apt.status === 'Completed' ? 'bg-[#bbf7d0] text-green-800' :
                              apt.status === 'Cancelled' ? 'bg-[#fecdd3] text-red-800' : 
                              'bg-[#fef3c7] text-yellow-800'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-1 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Calendar & Schedule */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
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
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = day === new Date().getDate();
                  const isSelected = selectedDate === formattedDate;
                  return (
                    <div key={i} className="flex flex-col items-center justify-center p-0.5 h-10">
                      <button 
                        onClick={() => setSelectedDate(formattedDate)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                          isSelected ? 'bg-blue-600 text-white font-bold' : 
                          isToday ? 'bg-blue-100 text-blue-600 font-bold' : 
                          'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                      <div className={`w-1 h-1 rounded-full mt-1 ${
                        appointments.some(a => a.date === formattedDate) ? (isSelected ? 'bg-blue-600' : 'bg-blue-500') : 'bg-transparent'
                      }`}></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#dbeafe] rounded-2xl p-5 border border-gray-200 shadow-sm flex-1">
              <h3 className="font-bold mb-4 rounded-lg text-gray-900 flex justify-between items-center">
                <span>Schedule</span>
                <span className="text-xs font-medium text-blue-700">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </h3>
              <div className="space-y-3">
                {stats.dateAppts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No appointments for this day.</p>
                ) : (
                  stats.dateAppts.map((apt, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="w-16 flex-shrink-0 text-right font-medium text-gray-600">{apt.time}</div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <p className="font-semibold text-gray-800">{apt.customerName}</p>
                        <p className="text-xs text-gray-500">{apt.reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 4-STEP APPOINTMENT WIZARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-3xl leading-none transition-colors">
                &times;
              </button>
            </div>

            {/* Stepper */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-center gap-2 text-xs md:text-sm font-medium">
              <div className={`flex items-center gap-1 ${modalStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep >= 1 ? 'border-blue-600' : 'border-gray-300'}`}>1</span>
                Customer Type
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 ${modalStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep >= 2 ? 'border-blue-600' : 'border-gray-300'}`}>2</span>
                Customer Info
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 ${modalStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep >= 3 ? 'border-blue-600' : 'border-gray-300'}`}>3</span>
                Appointment Details
              </div>
              <span className="text-gray-300">→</span>
              <div className={`flex items-center gap-1 ${modalStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep >= 4 ? 'border-blue-600' : 'border-gray-300'}`}>4</span>
                Confirm
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* STEP 1: Customer Type */}
              {modalStep === 1 && (
                <div>
                  <p className="text-gray-600 mb-6">Select if the customer is new or a returning customer.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => { setModalStep('new-customer'); }}
                      className="group border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200"
                    >
                      <div className="text-gray-700 group-hover:text-blue-600 mb-4 transition-colors">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">New Customer</h3>
                      <p className="text-sm text-gray-500 mb-6">Register a new customer and create an appointment.</p>
                      <div className="w-full bg-white border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium group-hover:bg-blue-50 transition-colors">Continue</div>
                    </div>

                    <div 
                      onClick={() => { setModalStep(2); }}
                      className="group border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200"
                    >
                      <div className="text-gray-700 group-hover:text-blue-600 mb-4 transition-colors">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Returning Customer</h3>
                      <p className="text-sm text-gray-500 mb-6">Choose from existing customers in your list.</p>
                      <div className="w-full bg-white border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium group-hover:bg-blue-50 transition-colors">Continue</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Customer Info (Search List) */}
              {modalStep === 2 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Select customer</h3>
                  
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by customer name, phone no..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] outline-none"
                    />
                  </div>

                  {/* Customer List */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white">
                    <div className="bg-[#f3e8ff] grid grid-cols-12 gap-2 p-3 text-xs font-bold text-gray-700 uppercase">
                      <div className="col-span-5">Customer Name</div>
                      <div className="col-span-4">Phone Number</div>
                      <div className="col-span-3">Last Visit</div>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                      {allCustomers
                        .filter(c => 
                          c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
                          c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone?.includes(customerSearch)
                        )
                        .map(customer => (
                          <div 
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={`grid grid-cols-12 gap-2 p-3 text-sm cursor-pointer transition-colors items-center ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className="col-span-5 flex items-center gap-2 font-medium text-gray-800">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCustomer?.id === customer.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                {selectedCustomer?.id === customer.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="col-span-4 text-gray-500">{customer.phone || 'N/A'}</div>
                            <div className="col-span-3 text-gray-500">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                          </div>
                        ))}
                      {allCustomers.length === 0 && <p className="text-center text-gray-500 py-4">No customers found.</p>}
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-between pt-2">
                    <button onClick={() => setModalStep(1)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                    <button 
                      onClick={() => setModalStep(3)} 
                      disabled={!selectedCustomer}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Appointment Details (Form) */}
              {modalStep === 3 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Appointment Details</h3>
                  <p className="text-sm text-gray-500 mb-6">Set the date, time and service for the appointment.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input 
                        type="date" 
                        value={newAppointment.date} 
                        onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                      <input 
                        type="time" 
                        value={newAppointment.time} 
                        onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                      <select 
                        value={newAppointment.reason} 
                        onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] bg-white"
                      >
                        <option value="Eye Examination">Eye Examination</option>
                        <option value="Dry Eye Test">Dry Eye Test</option>
                        <option value="Color Vision Test">Color Vision Test</option>
                        <option value="Contact Lens Fitting">Contact Lens Fitting</option>
                        <option value="Prescribing">Prescribing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                      <textarea 
                        value={newAppointment.note}
                        onChange={(e) => setNewAppointment({...newAppointment, note: e.target.value})}
                        rows="2"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none"
                      ></textarea>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-between pt-2">
                    <button onClick={() => setModalStep(2)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                    <button onClick={() => setModalStep(4)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Next</button>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirm */}
              {modalStep === 4 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Confirm Appointment</h3>
                  <p className="text-sm text-gray-500 mb-6">Please review the details before confirming.</p>
                  
                  {/* Summary Box */}
                  <div className="bg-gray-100 rounded-xl p-6 flex flex-col md:flex-row gap-8 mb-8 border border-gray-200">
                    
                    {/* Customer */}
                    <div className="flex gap-4 items-start flex-1">
                      <div className="text-gray-600 mt-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                        <p className="text-sm text-gray-500">{selectedCustomer?.phone || 'No phone'}</p>
                      </div>
                    </div>

                    <div className="w-px bg-gray-300 hidden md:block"></div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-4 items-center">
                        <div className="text-gray-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                          <p className="font-semibold text-gray-800 text-sm">
                            {new Date(newAppointment.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} • {new Date(`2000-01-01T${newAppointment.time}`).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-center">
                        <div className="text-gray-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Service</p>
                          <p className="font-semibold text-gray-800 text-sm">{newAppointment.reason}</p>
                        </div>
                      </div>

                      {newAppointment.note && (
                         <div className="flex gap-4 items-start">
                          <div className="text-gray-600 mt-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Notes</p>
                            <p className="text-sm text-gray-700 truncate max-w-[200px]">{newAppointment.note}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <button onClick={() => setModalStep(3)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Confirm Appointment</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ✅ Add Customer Modal (Opens over the wizard) */}
      {isModalOpen && modalStep === 'new-customer' && (
        <AddCustomerModal 
          onClose={(startVisitId) => {
            if (startVisitId) {
              setModalStep(2); // Go back to search if they finish, though they'd need to search the new guy
            } else {
              setModalStep(1);
            }
          }}
          onCustomerCreated={() => {}}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmModal isOpen={successMsg} title="Appointment Scheduled!" message="The appointment has been successfully added." icon="✅" confirmText="OK" confirmColor="green" isAlert onConfirm={() => setSuccessMsg(false)} />
      <ConfirmModal isOpen={!!errorMsg} title="Something Went Wrong" message={errorMsg} icon="❌" confirmText="OK" confirmColor="red" isAlert onConfirm={() => setErrorMsg('')} />
    </div>
  );
}

export default AppointmentPage;