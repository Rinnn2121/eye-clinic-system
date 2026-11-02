// src/components/ConfirmModal.js

import React from 'react';
import { createPortal } from 'react-dom'; // ✅ Import portal

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  icon,
  iconType = 'warning',
  isAlert = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const colorMap = {
    red:   'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue:  'bg-[#4A90E2] hover:bg-[#4A90E2]/90',
  };

  const getIcon = () => {
    if (icon) return icon;
    
    const baseClass = "w-14 h-14 mx-auto";
    
    switch (iconType) {
      case 'success':
        return (
          <svg className={`${baseClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${baseClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'delete':
        return (
          <svg className={`${baseClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`${baseClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
      default:
        return (
          <svg className={`${baseClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  // ✅ Render modal into document.body (escapes navbar stacking context)
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        
        <div className="mb-4 flex justify-center">
          {getIcon()}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>

        {message && (
          <p className="text-gray-500 text-sm mb-6 whitespace-pre-line">{message}</p>
        )}

        <div className="flex gap-3 mt-2">
          {isAlert ? (
            <button
              onClick={onConfirm}
              className={`flex-1 text-white py-2.5 rounded-xl text-sm font-medium transition-colors ${colorMap[confirmColor]}`}
            >
              {confirmText}
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-medium transition-colors ${colorMap[confirmColor]}`}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body // ✅ Appends to <body>, not the navbar
  );
}

export default ConfirmModal;