// src/pages/admin/AppointmentPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import AppointmentWizardModal from '../../components/AppointmentWizardModal';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';

function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [, setLoading] = useState(true);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Service');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0]);

  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null); 
  const [apptToCancel, setApptToCancel] = useState(null); 
  const [alertConfig, setAlertConfig] = useState(null); 

  // ✅ Load Data
  const loadAppointments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'appointments'));
      const items = [];
      querySnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });

      const now = new Date();
      const todayStr = new Date(now.getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().slice(0, 5);

      // Auto-cancel past appointments
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

      // Sort
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
        
        if (weightA === 1) {
          return dateA - dateB; 
        } else {
          return dateB - dateA; 
        }
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

  // ✅ Handle Cancel Appointment
  const handleCancelConfirm = async () => {
    if (!apptToCancel) return;

    try {
      await updateDoc(doc(db, 'appointments', apptToCancel.id), {
        status: 'Cancelled'
      });
      
      setApptToCancel(null);
      loadAppointments();
      
      setAlertConfig({
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'The appointment has been successfully cancelled.'
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not cancel the appointment.'
      });
    }
  };

  // ✅ Dynamic Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
    
    const dateAppts = appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return { total, completed, cancelled, dateAppts };
  }, [appointments, selectedDate]);

  // ✅ Filtering Logic
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.customerName?.toLowerCase().includes(lower) || 
        a.phone?.includes(lower)
      );
    }
    if (serviceFilter !== 'All Service') {
      result = result.filter(a => a.reason === serviceFilter);
    }
    if (statusFilter !== 'All Status') {
      result = result.filter(a => a.status === statusFilter);
    }
    return result;
  }, [appointments, searchTerm, serviceFilter, statusFilter]);

  // Calendar Helpers
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full mx-auto space-y-6">
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
              onClick={() => setIsWizardOpen(true)}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by customer name, phone no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setSelectedAppointment(apt)}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                              >
                                View
                              </button>
                              
                              {/* ✅ Only show Cancel button, Confirm button is removed */}
                              {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                                <button 
                                  onClick={() => setApptToCancel(apt)}
                                  className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
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
            
            {/* Calendar */}
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
                        hasAppointments 
                          ? (isSelected ? 'bg-blue-600' : 'bg-blue-500') 
                          : 'bg-transparent'
                      }`}></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Schedule Card */}
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
                      <div className="w-16 flex-shrink-0 text-right font-medium text-gray-600">
                        {apt.time}
                      </div>
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

      {/* ✅ Appointment Details Modal */}
      <AppointmentDetailsModal 
        appointment={selectedAppointment} 
        onClose={() => setSelectedAppointment(null)} 
      />

      {/* ✅ Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!apptToCancel}
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel the appointment for ${apptToCancel?.customerName} on ${apptToCancel?.date} at ${apptToCancel?.time}?`}
        icon="⚠️"
        confirmText="Yes, Cancel"
        confirmColor="red"
        onCancel={() => setApptToCancel(null)}
        onConfirm={handleCancelConfirm}
      />

      {/* ✅ Success/Error Alerts */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.type === 'success' ? '✅' : '❌'}
          confirmText="OK"
          confirmColor={alertConfig.type === 'success' ? 'green' : 'red'}
          isAlert
          onConfirm={() => setAlertConfig(null)}
        />
      )}

      {/* ✅ The Appointment Wizard Modal */}
      {isWizardOpen && (
        <AppointmentWizardModal 
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            loadAppointments();
            setAlertConfig({ type: 'success', title: 'Appointment Scheduled', message: 'The appointment was added successfully.' });
          }}
        />
      )}
    </div>
  );
}

export default AppointmentPage;