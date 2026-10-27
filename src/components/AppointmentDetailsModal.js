// src/components/AppointmentDetailsModal.js

import React from 'react';

function AppointmentDetailsModal({ appointment, onClose }) {
  if (!appointment) return null;

  // Format the date and time nicely (e.g., Oct 20, 2026 • 10:00 AM)
  const formattedDate = appointment.date 
    ? new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';
  const formattedTime = appointment.time 
    ? new Date(`2000-01-01T${appointment.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Customer Info */}
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="text-gray-500 mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{appointment.customerName || 'Walk-in Customer'}</h3>
                <p className="text-sm text-gray-500">{appointment.phone || 'No phone number'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-bold ${
              appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
              appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {appointment.status || 'Pending'}
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Date & Time */}
          <div className="flex gap-4 items-center">
            <div className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Date & Time</p>
              <p className="font-semibold text-gray-800">{formattedDate} • {formattedTime}</p>
            </div>
          </div>

          {/* Service */}
          <div className="flex gap-4 items-center">
            <div className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Service</p>
              <p className="font-semibold text-gray-800">{appointment.reason || 'General Consultation'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailsModal;