// src/pages/admin/ReportsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersSnap, apptsSnap, custSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'appointments')),
          getDocs(collection(db, 'customers'))
        ]);

        const ordersList = [];
        ordersSnap.forEach(d => ordersList.push({ id: d.id, ...d.data() }));
        
        const apptsList = [];
        apptsSnap.forEach(d => apptsList.push({ id: d.id, ...d.data() }));
        
        const custList = [];
        custSnap.forEach(d => custList.push({ id: d.id, ...d.data() }));

        setOrders(ordersList);
        setAppointments(apptsList);
        setCustomers(custList);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredSales = useMemo(() => {
    return orders.filter(o => {
      if (!o.orderDate) return false;
      const itemDate = o.orderDate.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (!a.date) return false;
      const itemDate = a.date.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }, [appointments, startDate, endDate]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.createdAt) return false;
      const itemDate = c.createdAt.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }, [customers, startDate, endDate]);

  // ✅ The Magic Export Function (HTML Table format for Excel)
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Report_${activeTab}_${startDate || 'All'}_to_${endDate || 'All'}.xls`;

    if (activeTab === 'sales') {
      headers = ['Receipt No', 'Date', 'Customer', 'Payment', 'Total', 'Paid', 'Balance', 'Status'];
      rows = filteredSales.map(s => {
        const isPaid = s.paymentStatus === 'paid' || s.balance <= 0;
        return [
          s.receiptNo || '—',
          s.orderDate ? new Date(s.orderDate).toLocaleDateString() : '—',
          s.customerName || '—',
          s.paymentMethod || 'Cash',
          `₱ ${Number(s.totalAmount || 0).toLocaleString()}`,
          `₱ ${Number(s.amountPaid || 0).toLocaleString()}`,
          `₱ ${Number(s.balance || 0).toLocaleString()}`,
          isPaid ? 'Paid' : 'Partial' // ✅ Fixes the 0 issue
        ];
      });
    } else if (activeTab === 'appointments') {
      headers = ['Date', 'Time', 'Customer', 'Phone', 'Service', 'Status'];
      rows = filteredAppointments.map(a => [
        a.date,
        a.time,
        a.customerName || 'Walk-in',
        a.phone || '—',
        a.reason || '—',
        a.status || 'Pending'
      ]);
    } else if (activeTab === 'customers') {
      headers = ['Reference ID', 'First Name', 'Last Name', 'Phone', 'Total Visits', 'Balance', 'Date Registered'];
      rows = filteredCustomers.map(c => [
        c.referenceId || '—',
        c.firstName || '—',
        c.lastName || '—',
        c.phone || '—',
        c.totalVisits || 0,
        `₱ ${Number(c.latestBalance || 0).toLocaleString()}`,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'
      ]);
    }

    // ✅ Build HTML Table for perfect formatting in Excel
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; width: 100%; }
          th { background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 10px; border: 1px solid #93c5fd; text-align: left; }
          td { padding: 8px 10px; border: 1px solid #e5e7eb; vertical-align: middle; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .status-paid { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }
          .status-partial { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <h2>${activeTab.toUpperCase()} REPORT</h2>
        <p>Date Range: ${startDate || 'All Time'} to ${endDate || 'All Time'}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    rows.forEach(row => {
      tableHTML += '<tr>';
      row.forEach((cell, index) => {
        let cellClass = '';
        // Align numbers to the right (columns 4, 5, 6 in Sales)
        if (activeTab === 'sales' && [4, 5, 6].includes(index)) cellClass = 'text-right';
        if (activeTab === 'customers' && index === 5) cellClass = 'text-right';
        if (activeTab === 'customers' && index === 4) cellClass = 'text-center';
        
        // Color code the Status column
        if ((activeTab === 'sales' && index === 7) || (activeTab === 'appointments' && index === 5)) {
          if (cell === 'Paid' || cell === 'Completed') cellClass = 'status-paid';
          else if (cell === 'Partial' || cell === 'Pending' || cell === 'Scheduled') cellClass = 'status-partial';
          else if (cell === 'Cancelled') cellClass = 'status-cancelled';
        }

        tableHTML += `<td class="${cellClass}">${cell}</td>`;
      });
      tableHTML += '</tr>';
    });

    tableHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create Blob and Download
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-base mt-1">Generate and export clinic reports.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-sm font-bold text-gray-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none"
              />
              <span className="text-sm font-bold text-gray-600 ml-2">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none"
              />
            </div>
            
            <button
              onClick={handleExportCSV}
              className="bg-[#22c55e] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
              activeTab === 'sales' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
              activeTab === 'appointments' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Appointments Report
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-6 text-base font-bold border-b-2 transition-colors ${
              activeTab === 'customers' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer List
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Receipt</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Payment</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-right">Total</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-right">Balance</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No sales found in this date range.</td></tr>
                  ) : (
                    filteredSales.map((s) => {
                      const isPaid = s.paymentStatus === 'paid' || s.balance <= 0;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{s.receiptNo || '—'}</td>
                          <td className="px-6 py-4 text-gray-600">{s.orderDate ? new Date(s.orderDate).toLocaleDateString() : '—'}</td>
                          <td className="px-6 py-4 text-gray-800 font-medium">{s.customerName || '—'}</td>
                          <td className="px-6 py-4 text-gray-600">{s.paymentMethod || 'Cash'}</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">₱ {Number(s.totalAmount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₱ {Number(s.balance || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isPaid ? 'Paid' : 'Partial'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Time</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Phone</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Service</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No appointments found in this date range.</td></tr>
                  ) : (
                    filteredAppointments.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{a.date}</td>
                        <td className="px-6 py-4 text-gray-600">{a.time}</td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{a.customerName || 'Walk-in'}</td>
                        <td className="px-6 py-4 text-gray-600">{a.phone || '—'}</td>
                        <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{a.reason}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            a.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                            a.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Reference ID</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Phone</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-center">Total Visits</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase text-right">Balance</th>
                    <th className="px-6 py-4 font-bold text-gray-700 uppercase">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No customers registered in this date range.</td></tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const hasBalance = (c.latestBalance || 0) > 0;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono font-medium text-[#4A90E2]">{c.referenceId || '—'}</td>
                          <td className="px-6 py-4 text-gray-800 font-medium">{c.lastName}, {c.firstName}</td>
                          <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                          <td className="px-6 py-4 text-center font-bold text-gray-700">{c.totalVisits || 0}</td>
                          <td className={`px-6 py-4 text-right font-bold ${hasBalance ? 'text-red-600' : 'text-gray-400'}`}>
                            ₱ {Number(c.latestBalance || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer Summary */}
        <div className="text-right text-sm font-medium text-gray-500">
          Showing {activeTab === 'sales' ? filteredSales.length : activeTab === 'appointments' ? filteredAppointments.length : filteredCustomers.length} records
        </div>

      </div>
    </div>
  );
}

export default ReportsPage;