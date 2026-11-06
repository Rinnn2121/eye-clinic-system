// src/pages/customer/CustomerAppointments.js

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import ConfirmModal from '../../components/ConfirmModal';
import BookingWizardModal from '../../components/BookingWizardModal';

function CustomerAppointments() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ New Tab State
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptToCancel, setApptToCancel] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);

  const [showBookingModal, setShowBookingModal] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const q = query(collection(db, 'appointments'), where('customerId', '==', currentUser.email));
      const snap = await getDocs(q);
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      
      items.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
      setAppointments(items);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
        message: 'Your appointment has been successfully cancelled.'
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

  if (loading) return <div className="text-center py-20 text-gray-500">Loading appointments...</div>;

  // ✅ Filter based on active tab
  const upcomingAppts = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed' || a.status === 'Scheduled');
  const pastAppts = appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');

  const currentAppts = activeTab === 'upcoming' ? upcomingAppts : pastAppts;

  const pendingCount = upcomingAppts.filter(a => a.status === 'Pending').length;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Scheduled':
      case 'Confirmed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' };
      case 'Pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Confirmation' };
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' };
      case 'Cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <div>
      {/* Header with Book Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Appointments</h1>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="bg-[#4A90E2] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm flex items-center gap-2 w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Book New Appointment
        </button>
      </div>

      {/* Pending confirmation banner */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3 items-start">
          <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-yellow-900">
              {pendingCount} appointment{pendingCount > 1 ? 's' : ''} awaiting confirmation
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              The clinic will confirm your booking shortly. You'll receive a notification once it's scheduled.
            </p>
          </div>
        </div>
      )}

      {/* ✅ TABS */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
            activeTab === 'upcoming' 
              ? 'border-[#4A90E2] text-[#4A90E2]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Upcoming ({upcomingAppts.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
            activeTab === 'past' 
              ? 'border-[#4A90E2] text-[#4A90E2]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Past Appointments ({pastAppts.length})
        </button>
      </div>

      {/* ✅ List based on active tab */}
      <div className="space-y-4">
        {currentAppts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">
              {activeTab === 'upcoming' 
                ? 'You have no upcoming appointments.' 
                : 'You have no past appointments.'}
            </p>
          </div>
        ) : (
          currentAppts.map(apt => {
            const badge = getStatusStyle(apt.status);
            const isPast = activeTab === 'past';

            return (
              <div 
                key={apt.id} 
                className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPast ? 'border-gray-200 bg-white' : 'border-blue-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isPast ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{apt.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long' })})</p>
                    <p className="text-xs text-gray-500">
                      {apt.time ? new Date(`2000-01-01T${apt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>

                <div className={`flex flex-col md:items-end gap-2 ${isPast ? 'md:flex-row md:items-center md:gap-4' : ''}`}>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  
                  <button 
                    onClick={() => setSelectedAppt(apt)}
                    className="border border-gray-300 text-gray-700 px-4 py-1.5 text-xs font-medium rounded hover:bg-gray-50 transition-colors w-full md:w-auto"
                  >
                    View Details
                  </button>
                  
                  {/* Only show Cancel button on Upcoming tab */}
                  {!isPast && (
                    <button 
                      onClick={() => setApptToCancel(apt)}
                      className="text-red-500 text-xs font-medium hover:underline text-center md:text-right w-full md:w-auto"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      <AppointmentDetailsModal 
        appointment={selectedAppt} 
        onClose={() => setSelectedAppt(null)} 
        onCancel={(apt) => {
          setSelectedAppt(null);
          setApptToCancel(apt);
        }}
      />

      <ConfirmModal
        isOpen={!!apptToCancel}
        title="Cancel Appointment?"
        message={`Are you sure you want to cancel your ${apptToCancel?.reason} appointment on ${apptToCancel?.date}? This action cannot be undone.`}
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

      {showBookingModal && (
        <BookingWizardModal 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
            fetchAppointments();
          }}
        />
      )}

    </div>
  );
}

export default CustomerAppointments;