// src/components/PendingAppointmentsModal.js

import React from 'react';

export default function PendingAppointmentsModal({ pendingAppointments, onClose, onSelectAppointment }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointments Needing Confirmation</h2>
            <p className="text-gray-500 text-sm mt-1">Please review and confirm the following appointments.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none mt-1">
            &times;
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto p-4 flex-1">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-[#dbeafe] text-gray-700 text-left">
                <th className="px-4 py-3 font-bold">Date & Time</th>
                <th className="px-4 py-3 font-bold">Customer Name</th>
                <th className="px-4 py-3 font-bold">Service</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingAppointments.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No pending appointments.</td></tr>
              ) : (
                pendingAppointments.map((apt) => (
                  <tr 
                    key={apt.id} 
                    onClick={() => {
                      onSelectAppointment(apt);
                      onClose(); // Close this modal when opening the details
                    }}
                    className="hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">
                        {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {apt.time ? new Date(`2000-01-01T${apt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{apt.customerName || 'Walk-in'}</div>
                      <div className="text-sm text-gray-500">{apt.phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate max-w-[200px]">{apt.reason}</td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-yellow-800">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            These appointments will appear in the main list once confirmed.
          </div>
          <button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}