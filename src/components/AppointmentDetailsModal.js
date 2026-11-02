// src/components/AppointmentDetailsModal.js

import React from 'react';

function AppointmentDetailsModal({ appointment, onClose, onConfirm, onCancel, isAdmin = false }) {
  if (!appointment) return null;

  const formattedDate = appointment.date 
    ? new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';
  const formattedTime = appointment.time 
    ? new Date(`2000-01-01T${appointment.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'N/A';

  const isPending = (appointment.status || '').toLowerCase() === 'pending';

  // ✅ Helper to format the audit date
  const formatAuditDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
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
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
              appointment.status === 'Completed' ? 'bg-green-100 text-green-700' :
              appointment.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
              appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
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
          <div className="flex gap-4 items-start">
            <div className="text-gray-500 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Service</p>
              <p className="font-semibold text-gray-800 break-words">{appointment.reason || 'General Consultation'}</p>
            </div>
          </div>

          {/* ✅ Audit Trail (Shows if confirmed or cancelled) */}
          {(appointment.confirmedBy || appointment.cancelledBy) && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs">
              {appointment.confirmedBy && (
                <p className="text-gray-600">
                  <strong className="text-green-700">Confirmed</strong> by {appointment.confirmedBy} 
                  <br/><span className="text-[10px] text-gray-400">{formatAuditDate(appointment.confirmedAt)}</span>
                </p>
              )}
              {appointment.cancelledBy && (
                <p className="text-gray-600 mt-1">
                  <strong className="text-red-600">Cancelled</strong> by {appointment.cancelledBy}
                  <br/><span className="text-[10px] text-gray-400">{formatAuditDate(appointment.cancelledAt)}</span>
                </p>
              )}
            </div>
          )}

        </div>

        {/* Action Buttons (Unchanged) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          {isAdmin && isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => onCancel(appointment)}
                className="flex-1 bg-white border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(appointment)}
                className="flex-1 bg-[#4A90E2] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
              >
                Confirm Booking
              </button>
            </div>
          )}

          {isAdmin && !isPending && appointment.status === 'Scheduled' && (
            <button
              onClick={() => onCancel(appointment)}
              className="w-full bg-white border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
            >
              Cancel Appointment
            </button>
          )}

          {(appointment.status === 'Completed' || appointment.status === 'Cancelled' || !isAdmin) && (
            <button
              onClick={onClose}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default AppointmentDetailsModal;