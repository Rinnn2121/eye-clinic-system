// src/components/ConfirmModal.js

import React from 'react';

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',      // 'red' | 'green' | 'blue'
  icon = '⚠️',
  isAlert = false,           // If true, only shows ONE button (for alerts)
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const colorMap = {
    red:   'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue:  'bg-[#4A90E2] hover:bg-[#4A90E2]/90',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        
        {/* Icon */}
        <div className="text-5xl mb-3">{icon}</div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>

        {/* Message */}
        {message && (
          <p className="text-gray-500 text-sm mb-6 whitespace-pre-line">{message}</p>
        )}

        {/* Buttons */}
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
    </div>
  );
}

export default ConfirmModal;