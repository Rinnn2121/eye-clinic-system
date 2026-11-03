// src/components/LabTrackingModal.js

import React, { useState } from 'react';

export default function LabTrackingModal({ order, onClose, onMarkReady, onMarkPickedUp }) {
  // ✅ State for the accordion toggle
  const [showProgress, setShowProgress] = useState(true);

  if (!order) return null;

  const isReady = ['ready', 'picked_up'].includes(order.status);
  const isPickedUp = order.status === 'picked_up';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* ✅ Blue Progress Banner (Clickable Dropdown) */}
          <div 
            onClick={() => setShowProgress(!showProgress)}
            className="bg-[#4A90E2] rounded-xl p-4 text-white cursor-pointer hover:bg-[#3b82f6] transition-colors"
          >
            <h3 className="font-bold text-lg flex justify-between items-center">
              {isPickedUp ? 'Your Order is Completed' : 'Order Progress'}
              {/* Rotating Chevron Icon */}
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${showProgress ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
          </div>

          {/* ✅ Tracking Timeline (Only shows when toggled) */}
          {showProgress && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="font-bold text-gray-800 mb-6 text-sm">Order Progress</p>
              <div className="flex justify-between items-start relative px-2">
                <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>
                
                <div className="flex flex-col items-center z-10 w-16">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white">✓</div>
                  <p className="text-[10px] text-center font-medium text-gray-600">Order<br/>Placed</p>
                </div>
                
                <div className="flex flex-col items-center z-10 w-16">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white">✓</div>
                  <p className="text-[10px] text-center font-medium text-gray-600">In<br/>Preparation</p>
                </div>
                
                <div className="flex flex-col items-center z-10 w-16">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white ${isReady ? 'bg-green-500' : 'bg-gray-300'}`}>
                     {isReady ? '✓' : ''}
                  </div>
                  <p className="text-[10px] text-center font-medium text-gray-600">Ready to<br/>Pick-Up</p>
                </div>
                
                <div className="flex flex-col items-center z-10 w-16">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mb-2 border-2 border-white ${isPickedUp ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isPickedUp ? '✓' : ''}
                  </div>
                  <p className="text-[10px] text-center font-medium text-gray-600">Picked Up</p>
                </div>
              </div>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Order Info */}
          <div>
            <h3 className="font-bold text-lg mb-3">Order #{order.id.slice(-5).toUpperCase()}</h3>
            
            <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Patient</p>
                <p className="font-medium text-gray-900">{order.patientName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Date</p>
                <p className="font-medium text-gray-900">{order.date}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Frame Category</p>
                <p className="font-medium text-gray-900">{order.frameCategory}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Specific Frame</p>
                <p className="font-medium text-gray-900">{order.specificFrame || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Lens</p>
                <p className="font-medium text-gray-900">{order.lens}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Coating</p>
                <p className="font-medium text-gray-900">{order.tint || order.coating || '—'}</p>
              </div>
            </div>

            {/* Prescription Box */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Prescription</p>
              <p className="text-sm text-gray-700"><strong>OD:</strong> {order.od || '—'}</p>
              <p className="text-sm text-gray-700"><strong>OS:</strong> {order.os || '—'}</p>
              <p className="text-sm text-gray-700"><strong>ADD:</strong> {order.add || '—'} | <strong>PD:</strong> {order.pd || '—'}</p>
            </div>

            {/* Lab Instructions */}
            {order.notes && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Lab Instructions</p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{order.notes}</p>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Total Price */}
          <div className="flex justify-between items-center font-bold text-lg pt-2">
            <span className="text-gray-800">Order Total:</span>
            <span className="text-gray-900">
              ₱ {Number(order.totalAmount || 0).toLocaleString()}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          {order.status === 'in_progress' && (
            <button 
              onClick={onMarkReady}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-sm"
            >
              Mark as Ready for Pickup
            </button>
          )}

          {order.status === 'ready' && (
            <button 
              onClick={onMarkPickedUp}
              className="w-full bg-[#4A90E2] text-white py-3 rounded-lg font-bold hover:bg-[#4A90E2]/90 transition-colors shadow-sm"
            >
              Mark as Picked Up
            </button>
          )}

          {order.status === 'picked_up' && (
            <button 
              onClick={onClose}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}