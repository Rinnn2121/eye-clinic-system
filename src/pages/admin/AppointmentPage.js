// src/pages/admin/AppointmentPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import AppointmentWizardModal from '../../components/AppointmentWizardModal';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import PendingAppointmentsModal from '../../components/PendingAppointmentsModal';

function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [, setLoading] = useState(true);
  const { userData, currentUser } = useAuth();
  const loggedInName = userData?.name || currentUser?.email?.split('@')[0] || 'Admin Staff';

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Service');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [timeFilter, setTimeFilter] = useState('Today');
  
  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0]);

  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null); 
  const [apptToCancel, setApptToCancel] = useState(null); 
  const [alertConfig, setAlertConfig] = useState(null); 
  const [showPendingModal, setShowPendingModal] = useState(false);

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

  const handleCancelConfirm = async () => {
    if (!apptToCancel) return;

    try {
      await updateDoc(doc(db, 'appointments', apptToCancel.id), {
        status: 'Cancelled',
        cancelledBy: loggedInName,
        cancelledAt: new Date().toISOString()
      });
      
      setApptToCancel(null);
      loadAppointments();
      
      setAlertConfig({ type: 'success', title: 'Appointment Cancelled', message: 'The appointment has been successfully cancelled.' });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Action Failed', message: 'Could not cancel the appointment.' });
    }
  };

  const handleConfirmAppt = async (apt) => {
    try {
      await updateDoc(doc(db, 'appointments', apt.id), {
        status: 'Scheduled',
        confirmedBy: loggedInName,
        confirmedAt: new Date().toISOString()
      });
      loadAppointments();
      setAlertConfig({ type: 'success', title: 'Booking Confirmed', message: 'The appointment has been marked as Scheduled.' });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Action Failed', message: 'Could not update the appointment.' });
    }
  };

  const handleConfirmAll = async () => {
    try {
      await Promise.all(pendingAppointmentsList.map(apt => 
        updateDoc(doc(db, 'appointments', apt.id), { 
          status: 'Scheduled',
          confirmedBy: loggedInName,
          confirmedAt: new Date().toISOString()
        })
      ));
      setShowPendingModal(false);
      loadAppointments();
      setAlertConfig({ type: 'success', title: 'All Confirmed', message: 'All pending appointments have been scheduled.' });
    } catch (err) {
      console.error(err);
      setAlertConfig({ type: 'error', title: 'Error', message: 'Failed to confirm all appointments.' });
    }
  };

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
    
    // ✅ Calculate Pending and Scheduled/Upcoming
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
    
    const dateAppts = appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .map(a => ({
        ...a,
        displayTime: a.time
          ? new Date(`2000-01-01T${a.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : ''
      }));

    return { total, completed, cancelled, pending, scheduled, dateAppts };
  }, [appointments, selectedDate]);

  const pendingAppointmentsList = useMemo(() => {
    return appointments
      .filter(a => a.status === 'Pending')
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  }, [appointments]);

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

    if (timeFilter !== 'All Time') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter(a => {
        const aptDate = new Date(`${a.date}T00:00:00`);
        
        if (timeFilter === 'Today') {
          const todayStr = new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
          return a.date === todayStr;
        }
        if (timeFilter === 'This Week') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return aptDate >= startOfWeek && aptDate <= endOfWeek;
        }
        if (timeFilter === 'This Month') {
          return aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    return result;
  }, [appointments, searchTerm, serviceFilter, statusFilter, timeFilter]);

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
            <p className="text-gray-500 text-base mt-1">Manage and monitor your clinic's upcoming and scheduled appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-base bg-white font-medium text-gray-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="bg-[#4A90E2] text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              + New Appointment
            </button>
          </div>
        </div>

        {/* TOP STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#fef3c7] rounded-2xl p-5 relative border border-yellow-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#eab308] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">Pending Confirmation</p>
              <h2 className="text-3xl font-bold text-gray-900">{stats.pending}</h2>
              <p className="text-xs text-gray-500 mt-1">Appointments need confirmation</p>
            </div>
          </div>

          <div className="bg-[#dbeafe] rounded-2xl p-5 relative border border-blue-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#4A90E2] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">Confirmed/Upcoming</p>
              <h2 className="text-3xl font-bold text-gray-900">{stats.scheduled}</h2>
              <p className="text-xs text-gray-500 mt-1">Appointments scheduled this week</p>
            </div>
          </div>

          <div className="bg-[#dcfce7] rounded-2xl p-5 relative border border-green-200 shadow-sm flex items-center gap-4">
            <div className="bg-[#22c55e] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">Completed Appointments</p>
              <h2 className="text-3xl font-bold text-gray-900">{stats.completed}</h2>
              <p className="text-xs text-gray-500 mt-1">Appointments completed this week</p>
            </div>
          </div>
        </div>

        {/* NEEDS CONFIRMATION ALERT BANNER */}
        {stats.pending > 0 && (
          <div className="bg-[#fffbeb] rounded-2xl p-4 border border-yellow-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 md:mt-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-900">{stats.pending} Appointments Need Confirmation</h3>
                <p className="text-yellow-800 text-sm mt-0.5">Review and confirm the requested appointments to keep your schedule updated.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPendingModal(true)}
              className="bg-white border-2 border-yellow-500 text-yellow-700 px-6 py-2 rounded-xl text-base font-bold hover:bg-yellow-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              View Pending ({stats.pending}) 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {/* MAIN CONTENT ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by customer name, phone no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
                />
              </div>
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white text-gray-600 outline-none">
                <option value="All Service">All Service</option>
                <option value="Eye Examination">Eye Examination</option>
                <option value="Dry Eye Test">Dry Eye Test</option>
                <option value="Color Vision Test">Color Vision Test</option>
                <option value="Contact Lens Fitting">Contact Lens Fitting</option>
                <option value="Prescribing">Prescribing</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white text-gray-600 outline-none">
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Link to="/admin/all-appointments" className="text-base text-[#4A90E2] hover:underline font-bold ml-auto">
                View All →
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-base">
                  <thead>
                    <tr className="bg-[#dbeafe] text-gray-700 text-left border-b border-gray-200">
                      <th className="px-5 py-3 font-bold">Date & Time</th>
                      <th className="px-5 py-3 font-bold">Customer</th>
                      <th className="px-5 py-3 font-bold">Service</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAppointments.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-base">No appointments found.</td></tr>
                    ) : (
                      filteredAppointments.slice(0, 5).map((apt) => (
                        <tr 
                          key={apt.id} 
                          onClick={() => setSelectedAppointment(apt)}
                          className="hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-800 text-base">
                              {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                              {apt.time ? new Date(`2000-01-01T${apt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-800 text-base">{apt.customerName || 'Walk-in'}</div>
                            <div className="text-sm text-gray-500">{apt.phone || 'N/A'}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-600 text-base truncate max-w-[150px]">
                            {apt.reason}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              apt.status === 'Completed' ? 'bg-[#bbf7d0] text-green-800' :
                              apt.status === 'Cancelled' ? 'bg-[#fecdd3] text-red-800' : 
                              apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-[#fef3c7] text-yellow-800'
                            }`}>
                              {apt.status}
                            </span>
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
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendar
                </h3>
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

              <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-400 mb-2 font-medium">
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
                    <div key={i} className="flex flex-col items-center justify-center p-0.5 h-10">
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

            <div className="bg-[#dbeafe] rounded-2xl p-5 border border-gray-200 shadow-sm flex-shrink-0">
              <h3 className="font-bold mb-4 rounded-lg text-gray-900 flex justify-between items-center text-xl">
                <span>Schedule</span>
                <span className="text-sm font-medium text-blue-700">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </h3>
              
              <div className="space-y-3 overflow-y-auto pr-1 max-h-[160px]">
                {stats.dateAppts.length === 0 ? (
                  <p className="text-base text-gray-500 text-center py-4">No appointments for this day.</p>
                ) : (
                  stats.dateAppts.map((apt, idx) => (
                    <div key={idx} className="flex gap-3 text-base">
                      <div className="w-20 flex-shrink-0 text-right font-medium text-gray-600">
                        {apt.displayTime}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{apt.customerName}</p>
                        <p className="text-sm text-gray-500 truncate">{apt.reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Pending Modal (With Confirm All logic passed in) */}
      {showPendingModal && (
        <PendingAppointmentsModal 
          pendingAppointments={pendingAppointmentsList}
          onClose={() => setShowPendingModal(false)}
          onSelectAppointment={(apt) => setSelectedAppointment(apt)}
          onConfirmAll={handleConfirmAll}
        />
      )}

      <AppointmentDetailsModal 
        appointment={selectedAppointment} 
        onClose={() => setSelectedAppointment(null)} 
        onConfirm={(apt) => {
          setSelectedAppointment(null);
          handleConfirmAppt(apt);
        }}
        onCancel={(apt) => {
          setSelectedAppointment(null);
          setApptToCancel(apt);
        }}
        isAdmin={true}
      />

      <ConfirmModal
        isOpen={!!apptToCancel}
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel the appointment for ${apptToCancel?.customerName} on ${apptToCancel?.date} at ${apptToCancel?.time ? new Date(`2000-01-01T${apptToCancel.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}?`}
        iconType="warning"
        confirmText="Yes, Cancel"
        confirmColor="red"
        onCancel={() => setApptToCancel(null)}
        onConfirm={handleCancelConfirm}
      />

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