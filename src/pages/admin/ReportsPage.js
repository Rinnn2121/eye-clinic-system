// src/pages/admin/ReportsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx'; // ✅ Import xlsx

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // ✅ Filter & Sort Sales (Newest First)
  const filteredSales = useMemo(() => {
    return orders.filter(o => {
      if (!o.orderDate) return false;
      const itemDate = o.orderDate.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, [orders, startDate, endDate]);

  // ✅ Filter & Sort Appointments (Newest First)
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (!a.date) return false;
      const itemDate = a.date.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    }).sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));
  }, [appointments, startDate, endDate]);

  // ✅ Filter & Sort Customers (Newest First)
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.createdAt) return false;
      const itemDate = c.createdAt.split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [customers, startDate, endDate]);

  // ✅ Reset Page when Tab or Dates change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, startDate, endDate]);

  // ✅ Pagination Logic for all tabs
  const getCurrentItems = () => {
    let dataToPaginate = [];
    if (activeTab === 'sales') dataToPaginate = filteredSales;
    if (activeTab === 'appointments') dataToPaginate = filteredAppointments;
    if (activeTab === 'customers') dataToPaginate = filteredCustomers;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return {
      items: dataToPaginate.slice(indexOfFirstItem, indexOfLastItem),
      totalPages: Math.ceil(dataToPaginate.length / itemsPerPage) || 1,
      totalRecords: dataToPaginate.length
    };
  };

  const { items: currentItems, totalPages, totalRecords } = getCurrentItems();

  // ✅ NEW: Clean Excel Export using xlsx
  const handleExportExcel = () => {
    let dataToExport = [];
    let filename = `Report_${activeTab}_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;

    if (activeTab === 'sales') {
      dataToExport = filteredSales.map(s => {
        const isPaid = s.paymentStatus === 'paid' || s.balance <= 0;
        return {
          'Receipt No': s.receiptNo || '—',
          'Date': s.orderDate ? new Date(s.orderDate).toLocaleDateString() : '—',
          'Customer': s.customerName || '—',
          'Payment Method': s.paymentMethod || 'Cash',
          'Total Amount': `₱ ${Number(s.totalAmount || 0).toLocaleString()}`,
          'Amount Paid': `₱ ${Number(s.amountPaid || 0).toLocaleString()}`,
          'Balance': `₱ ${Number(s.balance || 0).toLocaleString()}`,
          'Status': isPaid ? 'Paid' : 'Partial'
        };
      });
    } else if (activeTab === 'appointments') {
      dataToExport = filteredAppointments.map(a => ({
        'Date': a.date,
        'Time': a.time,
        'Customer': a.customerName || 'Walk-in',
        'Phone': a.phone || '—',
        'Service': a.reason || '—',
        'Status': a.status || 'Pending'
      }));
    } else if (activeTab === 'customers') {
      dataToExport = filteredCustomers.map(c => ({
        'Reference ID': c.referenceId || '—',
        'First Name': c.firstName || '—',
        'Last Name': c.lastName || '—',
        'Phone': c.phone || '—',
        'Total Visits': c.totalVisits || 0,
        'Balance': `₱ ${Number(c.latestBalance || 0).toLocaleString()}`,
        'Date Registered': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'
      }));
    }

    // ✅ Create the workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());

    // ✅ Auto-fit column widths
    const maxWidths = {};
    dataToExport.forEach(row => {
      Object.keys(row).forEach(key => {
        const value = row[key] ? row[key].toString() : '';
        const width = value.length > key.length ? value.length : key.length;
        maxWidths[key] = Math.max(maxWidths[key] || 10, width);
      });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

    // ✅ Download file
    XLSX.writeFile(workbook, filename);
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
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-sm font-bold text-gray-800">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
              <span className="text-sm font-bold text-gray-800 ml-2">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>
            
            <button
              onClick={handleExportExcel}
              className="bg-[#22c55e] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2"
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
                  {currentItems.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No sales found in this date range.</td></tr>
                  ) : (
                    currentItems.map((s) => {
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
                  {currentItems.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No appointments found in this date range.</td></tr>
                  ) : (
                    currentItems.map((a) => (
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
                  {currentItems.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No customers registered in this date range.</td></tr>
                  ) : (
                    currentItems.map((c) => {
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

                {/* ✅ Pagination & Summary Row */}
        {totalRecords > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
            
            <div className="text-sm font-medium text-gray-500 order-2 md:order-1">
              Showing {totalRecords} records • Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2 order-1 md:order-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
              >
                Prev
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && pageNum !== currentPage) {
                    if (pageNum === 3) return <span key={pageNum} className="px-2 py-1 text-gray-400">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-md text-sm border shadow-sm font-medium ${
                        currentPage === pageNum 
                          ? 'bg-blue-50 border-[#4A90E2] text-[#4A90E2] font-bold' 
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;