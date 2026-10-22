// src/components/TransactionDetailsModal.js

import React from 'react';

function TransactionDetailsModal({ sale, onClose }) {
  if (!sale) return null;

  // Format Date
  const formattedDate = sale.orderDate 
    ? new Date(sale.orderDate).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
      })
    : '—';

  // Determine Status
  const isPartial = sale.balance > 0;
  const statusText = sale.paymentStatus === 'paid' || !isPartial ? 'Paid' : 'Partial';

  // Format Currency
  const peso = (num) => `₱ ${Number(num || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

  // Calculate Subtotal (Total + Discount) just in case we have discounts stored
  const discount = Number(sale.discount) || 0;
  const subtotal = (sale.totalAmount || 0) + discount;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Section: Receipt Info */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-gray-100">
            {/* Icon */}
            <div className="bg-blue-50 text-[#4A90E2] w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              🖨️
            </div>
            
            {/* Receipt No */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Receipt No.</p>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-lg">{sale.receiptNo || 'N/A'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  statusText === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {statusText}
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="md:ml-auto md:border-l border-gray-200 md:pl-8">
              <p className="text-xs text-gray-500 font-medium mb-1">Date & Time</p>
              <p className="font-bold text-gray-900 text-sm">{formattedDate}</p>
            </div>

            {/* Payment Method */}
            <div className="md:border-l border-gray-200 md:pl-8">
              <p className="text-xs text-gray-500 font-medium mb-1">Payment Method</p>
              <p className={`font-bold text-sm ${sale.paymentMethod === 'Cash' ? 'text-green-600' : 'text-blue-600'}`}>
                {sale.paymentMethod || 'Cash'}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Customer</p>
            <p className="text-lg font-bold text-gray-900">{sale.customerName || 'Walk-in Customer'}</p>
            {sale.customerPhone && (
              <p className="text-sm text-gray-600">Phone: {sale.customerPhone}</p>
            )}
          </div>

          {/* Two Columns: Items & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Items Purchased */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Items Purchased</h3>
              <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-[#dbeafe] text-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Item</th>
                      <th className="text-center px-3 py-2 font-semibold text-xs">Qty</th>
                      <th className="text-right px-3 py-2 font-semibold text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item, idx) => (
                        <tr key={idx} className="text-gray-700">
                          <td className="px-3 py-2">{item.name || 'Unknown Item'}</td>
                          <td className="px-3 py-2 text-center">{item.qty || 1}</td>
                          <td className="px-3 py-2 text-right">
                            {peso((item.price || 0) * (item.qty || 1))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-3 py-4 text-center text-gray-500">No items listed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{peso(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>{peso(discount)}</span>
                </div>
                <div className="flex justify-between bg-[#dbeafe] p-2 rounded-md font-bold text-gray-900 mt-2">
                  <span>Total</span>
                  <span>{peso(sale.totalAmount)}</span>
                </div>
              </div>
            </div>


            {/* Right Column: Payment & Notes */}
            <div className="space-y-4">
              
              {/* Payment Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Payment Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Amount</span>
                    <span className="font-medium text-gray-900">{peso(sale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Deposit / Amount Paid</span>
                    <span className="font-medium text-gray-900">{peso(sale.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 pt-2">
                    <span>Balance</span>
                    <span>{peso(sale.balance)}</span>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Payment History Ledger */}
              {sale.paymentHistory && sale.paymentHistory.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Payment History</h3>
                  <div className="space-y-2">
                    {sale.paymentHistory.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center text-xs text-gray-600 border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>
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

              {/* Notes */}
              <div className="border border-gray-200 rounded-lg p-4 h-32">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Notes</h3>
                <p className="text-sm text-gray-600">
                  {sale.notes || sale.additionalNotes || '...'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;