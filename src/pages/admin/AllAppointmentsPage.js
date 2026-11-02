// src/pages/admin/AllAppointmentsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import ConfirmModal from '../../components/ConfirmModal';

function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Service');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // ✅ Date Range Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // ✅ Changed to 10 per page

  // Modal & Alert States
  const [selectedAppointment, setSelectedAppointment] = useState(null); 
  const [apptToCancel, setApptToCancel] = useState(null); 
  const [alertConfig, setAlertConfig] = useState(null); 

  // ✅ Fetch Appointments
  const fetchAppointments = async () => {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

      const now = new Date();
      const todayStr = new Date(now.getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().slice(0, 5);

      // Auto-cancel past appointments
      const updatedItems = await Promise.all(list.map(async (apt) => {
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

      // Sort: Pending/Scheduled -> Completed -> Cancelled
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
      console.error("Error fetching appointments:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ✅ Handle Cancel Appointment
  const handleCancelConfirm = async () => {
    if (!apptToCancel) return;

    try {
      await updateDoc(doc(db, 'appointments', apptToCancel.id), {
        status: 'Cancelled'
      });
      
      setApptToCancel(null);
      fetchAppointments(); 
      
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
        message: 'Could not cancel the appointment. Please try again.'
      });
    }
  };

  // ✅ Handle Confirm Appointment
  const handleConfirmAppt = async (apt) => {
    try {
      await updateDoc(doc(db, 'appointments', apt.id), {
        status: 'Scheduled'
      });
      fetchAppointments();
      setAlertConfig({
        type: 'success',
        title: 'Booking Confirmed',
        message: `${apt.customerName}'s appointment is now scheduled.`
      });
    } catch (err) {
      console.error(err);
      setAlertConfig({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not confirm the appointment.'
      });
    }
  };

  // ✅ Filter & Search Logic
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.customerName?.toLowerCase().includes(lower) || 
        a.phone?.includes(lower)
      );
    }
    // Service
    if (serviceFilter !== 'All Service') {
      result = result.filter(a => a.reason === serviceFilter);
    }
    // Status
    if (statusFilter !== 'All Status') {
      result = result.filter(a => a.status === statusFilter);
    }

    // ✅ Date Range Filter
    if (startDate) {
      result = result.filter(a => a.date >= startDate);
    }
    if (endDate) {
      result = result.filter(a => a.date <= endDate);
    }

    return result;
  }, [appointments, searchTerm, serviceFilter, statusFilter, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter, statusFilter, startDate, endDate]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

  // Clear Filters
  const clearFilters = () => {
    setSearchTerm('');
    setServiceFilter('All Service');
    setStatusFilter('All Status');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-gray-500 text-base mt-1">View and manage the complete history of appointments.</p>
          </div>
          <Link to="/admin/appointments" className="text-gray-400 hover:text-gray-700 text-3xl leading-none">
            &times;
          </Link>
        </div>

        {/* ✅ Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-fit">
          <span className="text-sm font-bold text-gray-700 ml-1">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A90E2]"
          />
          <span className="text-sm font-bold text-gray-700">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A90E2]"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by customer name, phone no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent outline-none"
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

          <button onClick={clearFilters} className="text-base text-[#4A90E2] hover:underline font-bold flex items-center gap-1 ml-auto px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Clear All Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-[#dbeafe] text-gray-700 text-left border-b border-gray-200">
                  <th className="px-6 py-4 font-bold">Date & Time</th>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Service</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-base">Loading appointments...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-base">No appointments found matching your filters.</td></tr>
                ) : (
                  currentItems.map((apt) => (
                    <tr 
                      key={apt.id} 
                      onClick={() => setSelectedAppointment(apt)}
                      className="hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 text-base">
                          {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {apt.time ? new Date(`2000-01-01T${apt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 text-base">{apt.customerName || 'Walk-in'}</div>
                        <div className="text-sm text-gray-500">{apt.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
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

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="flex justify-center items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Prev</button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 7 && pageNum > 3 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                  if (pageNum === 4) return <span key={pageNum} className="px-2 py-1 text-gray-400">...</span>;
                  return null;
                }
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 rounded-md text-sm border ${currentPage === pageNum ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{pageNum}</button>
                );
              })}
            </div>

            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        )}

      </div>

      {/* ✅ Appointment Details Modal */}
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

      {/* ✅ Cancel Confirmation Modal */}
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

      {/* ✅ Success/Error Alerts */}
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

export default AllAppointmentsPage;