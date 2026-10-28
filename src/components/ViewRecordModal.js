// src/components/ViewRecordModal.js

import React from 'react';

function ViewRecordModal({ record, customer, onClose, onUpdatePayment }) {
  if (!record) return null;

  const oldRx = record.oldPrescription || { od: {}, os: {} };
  const newRx = record.newPrescription || { od: {}, os: {} };

  // Fallback logic for name
  let fName = record.firstName || customer?.firstName || '';
  let lName = record.lastName || customer?.lastName || '';
  if (!fName && !lName && record.customerName) {
    const parts = record.customerName.split(',');
    if (parts.length > 1) {
      lName = parts[0].trim();
      fName = parts[1].trim();
    }
  }

  const nickname = record.nickname || customer?.nickname || '';
  const address = record.address || customer?.address || '';
  const age = record.age || customer?.age || '';
  const phone = record.phone || customer?.phone || '';
  const occupation = record.occupation || customer?.occupation || '';

  // ✅ Helper function to calculate the difference
const getDiff = (oldVal, newVal) => {
  // Convert strings to numbers
  const o = parseFloat(oldVal);
  const n = parseFloat(newVal);
  
  // If either is empty or not a number, return null (no badge)
  if (isNaN(o) || isNaN(n)) return null;
  
  const diff = n - o;
  if (diff === 0) return null; // No change
  
  // Format as "+0.50" or "-0.50"
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(2)}`;
};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 pt-10 pb-10 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl border border-gray-200 relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center text-xl transition-colors font-bold z-10"
          title="Close"
        >
          &times;
        </button>

        <div className="p-8 space-y-5">
          
          {/* Logo */}
          <div className="mb-4">
            <img src="/images/vslogo.png" alt="Logo" className="h-16 w-auto object-contain" />
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-300 rounded px-3 py-2 text-sm font-medium">
              {lName}
              <p className="text-[10px] text-gray-500 uppercase mt-1">Last Name</p>
            </div>
            <div className="border border-gray-300 rounded px-3 py-2 text-sm font-medium">
              {fName}
              <p className="text-[10px] text-gray-500 uppercase mt-1">First Name</p>
            </div>
            <div className="border border-gray-300 rounded px-3 py-2 text-sm font-medium">
              {nickname}
              <p className="text-[10px] text-gray-500 uppercase mt-1">Nickname</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-end gap-2">
            <span className="text-[11px] font-bold text-gray-700 uppercase w-20">Address:</span>
            <div className="flex-1 border-b border-gray-400 pb-1 text-sm">{address}</div>
          </div>

          {/* Age & Contact */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-end gap-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase w-10">Age:</span>
              <div className="flex-1 border-b border-gray-400 pb-1 text-sm">{age}</div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase w-24">Contact No.:</span>
              <div className="flex-1 border-b border-gray-400 pb-1 text-sm">{phone}</div>
            </div>
          </div>

          {/* Occupation & Date */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-end gap-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase w-24">Occupation:</span>
              <div className="flex-1 border-b border-gray-400 pb-1 text-sm">{occupation}</div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase w-10">Date:</span>
              <div className="flex-1 border-b border-gray-400 pb-1 text-sm">{record.date}</div>
            </div>
          </div>

          {/* OLD PRESCRIPTION TABLE */}
          <div className="border border-gray-400 rounded-md overflow-hidden mt-6">
            <div className="grid grid-cols-[60px_1fr_60px] bg-gray-100 border-b border-gray-400">
              <div className="border-r border-gray-400 p-2 text-center font-bold text-[10px] uppercase">PD</div>
              <div className="border-r border-gray-400 p-2 text-center font-bold text-[10px] uppercase">Old Prescription</div>
              <div className="p-2 text-center font-bold text-[10px] uppercase">ADD</div>
            </div>
            
            <div className="grid grid-cols-[60px_1fr_60px] border-b border-gray-200">
              <div className="border-r border-gray-400 p-2 flex items-center justify-center text-sm font-medium">
                {record.oldPd || 'PD'}
              </div>
              <div className="border-r border-gray-400 p-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">OD:</span>
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">SPH</span>
                  <span className="text-xs font-medium">{oldRx.od?.sph || '-'}</span>
                </div>
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">CYL</span>
                  <span className="text-xs font-medium">{oldRx.od?.cyl || '-'}</span>
                </div>
                <span className="text-[10px] text-gray-400 px-1">x</span>
                <div className="w-14 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">Axis</span>
                  <span className="text-xs font-medium">{oldRx.od?.axis || '-'}</span>
                </div>
              </div>
              <div className="p-2 text-center text-sm font-medium flex items-center justify-center">
                {oldRx.add || '-'}
              </div>
            </div>

            <div className="grid grid-cols-[60px_1fr_60px]">
              <div className="border-r border-gray-400 p-2"></div>
              <div className="border-r border-gray-400 p-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">OS:</span>
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">SPH</span>
                  <span className="text-xs font-medium">{oldRx.os?.sph || '-'}</span>
                </div>
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">CYL</span>
                  <span className="text-xs font-medium">{oldRx.os?.cyl || '-'}</span>
                </div>
                <span className="text-[10px] text-gray-400 px-1">x</span>
                <div className="w-14 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">Axis</span>
                  <span className="text-xs font-medium">{oldRx.os?.axis || '-'}</span>
                </div>
              </div>
              <div className="p-2"></div>
            </div>
          </div>

                    {/* NEW PRESCRIPTION TABLE */}
          <div className="border border-gray-400 rounded-md overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_60px] bg-gray-100 border-b border-gray-400">
              <div className="border-r border-gray-400 p-2 text-center font-bold text-[10px] uppercase">PD</div>
              <div className="border-r border-gray-400 p-2 text-center font-bold text-[10px] uppercase">New Prescription</div>
              <div className="p-2 text-center font-bold text-[10px] uppercase">ADD</div>
            </div>
            
            {/* OD Row */}
            <div className="grid grid-cols-[60px_1fr_60px] border-b border-gray-200">
              <div className="border-r border-gray-400 p-2 flex items-center justify-center text-sm font-medium">
                {record.newPd || 'PD'}
              </div>
              <div className="border-r border-gray-400 p-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">OD:</span>
                
                {/* ✅ SPH with Diff */}
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">SPH</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{newRx.od?.sph || '-'}</span>
                    {getDiff(oldRx.od?.sph, newRx.od?.sph) && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        getDiff(oldRx.od?.sph, newRx.od?.sph).startsWith('+') 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-red-600 bg-red-50'
                      }`}>
                        {getDiff(oldRx.od?.sph, newRx.od?.sph)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ✅ CYL with Diff */}
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">CYL</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{newRx.od?.cyl || '-'}</span>
                    {getDiff(oldRx.od?.cyl, newRx.od?.cyl) && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        getDiff(oldRx.od?.cyl, newRx.od?.cyl).startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {getDiff(oldRx.od?.cyl, newRx.od?.cyl)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-gray-400 px-1">x</span>

                {/* Axis (No diff needed here usually, but you could add it) */}
                <div className="w-14 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">Axis</span>
                  <span className="text-xs font-medium">{newRx.od?.axis || '-'}</span>
                </div>
              </div>
              <div className="p-2 text-center text-sm font-medium flex items-center justify-center">
                {newRx.add || '-'}
              </div>
            </div>

            {/* OS Row */}
            <div className="grid grid-cols-[60px_1fr_60px]">
              <div className="border-r border-gray-400 p-2"></div>
              <div className="border-r border-gray-400 p-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">OS:</span>
                
                {/* ✅ SPH with Diff */}
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">SPH</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{newRx.os?.sph || '-'}</span>
                    {getDiff(oldRx.os?.sph, newRx.os?.sph) && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        getDiff(oldRx.os?.sph, newRx.os?.sph).startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {getDiff(oldRx.os?.sph, newRx.os?.sph)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ✅ CYL with Diff */}
                <div className="flex-1 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">CYL</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{newRx.os?.cyl || '-'}</span>
                    {getDiff(oldRx.os?.cyl, newRx.os?.cyl) && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        getDiff(oldRx.os?.cyl, newRx.os?.cyl).startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {getDiff(oldRx.os?.cyl, newRx.os?.cyl)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-gray-400 px-1">x</span>

                <div className="w-14 flex flex-col border-b border-gray-300">
                  <span className="text-[8px] text-gray-400">Axis</span>
                  <span className="text-xs font-medium">{newRx.os?.axis || '-'}</span>
                </div>
              </div>
              <div className="p-2"></div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-700 mb-1">Prescription Notes / Remarks</label>
              <div className="w-full border border-gray-300 rounded-lg p-2 text-sm min-h-[60px] bg-gray-50">
                {record.prescriptionNotes || ''}
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-700 mb-1">Additional Notes</label>
              <div className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50">
                {record.additionalNotes || ''}
              </div>
            </div>
          </div>

          {/* Dropdowns (Read Only) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold w-20 text-gray-700">FRAME:</span>
              <div className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 flex justify-between items-center">
                {record.frame?.name || 'Select frame'}
                <span className="text-gray-400 text-xs">▼</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold w-20 text-gray-700">LENS TYPE:</span>
              <div className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 flex justify-between items-center">
                {record.lensType?.name || 'Select lens type'}
                <span className="text-gray-400 text-xs">▼</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold w-20 text-gray-700">COATING:</span>
              <div className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 flex justify-between items-center">
                {record.coating?.name || 'Select coating'}
                <span className="text-gray-400 text-xs">▼</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700 w-20">TOTAL:</span>
              <div className="flex-1 border-b border-gray-300 pb-1 text-lg font-bold">
                ₱ {Number(record.total || 0).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-gray-600 w-20 leading-tight">AMOUNT<br/>PAID:</span>
              <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-medium">
                {Number(record.amountPaid || 0).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700 w-20">BALANCE:</span>
              <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-bold text-red-600">
                ₱{Number(record.balance || 0).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">PAYMENT METHOD:</span>
                <div className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white flex justify-between">
                  {record.paymentMethod || 'Cash'} <span className="text-gray-400 text-xs">▼</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-600">STATUS:</span>
                <div className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 text-gray-500 flex justify-between">
                  {record.paymentStatus === 'paid' ? 'Fully Paid' : 'Pending (May Balance)'}
                  <span className="text-gray-400 text-xs">▼</span>
                </div>
              </div>
            </div>
          </div>

                    {/* Optometrist */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-[11px] font-bold text-gray-700 w-24">OPTOMETRIST:</span>
            <div className="flex-1 border-b border-gray-400 pb-1 text-sm font-bold">
              {record.optometrist || ''}
            </div>
          </div>

          {/* ✅ NEW: Payment History Ledger */}
          {record.paymentHistory && record.paymentHistory.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mt-6">
              <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wide">Payment History Ledger</h4>
              <div className="space-y-2">
                {record.paymentHistory.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center text-xs text-gray-600 border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="font-medium">
                        {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>{payment.method}</span>
                    </div>
                    <span className="font-bold text-gray-900">₱ {Number(payment.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {record.balance > 0 && (
              <button
                onClick={() => onUpdatePayment(record)}
                className="flex-1 bg-[#4A90E2] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 transition-colors"
              >
                Update Payment
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ViewRecordModal;