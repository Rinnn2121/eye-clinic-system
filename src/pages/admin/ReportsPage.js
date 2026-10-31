// src/pages/admin/ReportsPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setOrders(list);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (startDate) result = result.filter(o => new Date(o.orderDate) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.orderDate) <= end);
    }
    return result;
  }, [orders, startDate, endDate]);

  const reportData = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    let netSales = 0;
    let cashTotal = 0;
    let gcashTotal = 0;
    let cardTotal = 0;
    let eightPercentTax = 0;
    let taxableBase = 0;

    filteredOrders.forEach(order => {
      // Ignore partial payment receipts (PAY-) for gross sales
      const isPaymentReceipt = order.receiptNo?.startsWith('PAY-');
      
      if (!isPaymentReceipt) {
        const total = Number(order.totalAmount) || 0;
        const discount = Number(order.discount) || 0;
        
        grossSales += total + discount;
        discounts += discount;
        netSales += total;
      }

      const paid = Number(order.amountPaid) || 0;
      if (order.paymentMethod === 'Cash') cashTotal += paid;
      else if (order.paymentMethod === 'GCash') gcashTotal += paid;
      else if (order.paymentMethod === 'Card') cardTotal += paid;
    });

    // ✅ 8% Tax Calculation (First 250,000 is exempt)
    taxableBase = netSales - 250000;
    if (taxableBase < 0) taxableBase = 0;
    
    eightPercentTax = taxableBase * 0.08;

    return { 
      grossSales, 
      discounts, 
      netSales, 
      cashTotal, 
      gcashTotal, 
      cardTotal, 
      taxableBase, 
      eightPercentTax 
    };
  }, [filteredOrders]);

  const exportToCSV = () => {
    const headers = ['Receipt No', 'Date', 'Customer Name', 'Total Amount', 'Payment Method', 'Status'];
    const rows = filteredOrders.map(o => [
      o.receiptNo,
      new Date(o.orderDate).toLocaleDateString(),
      o.customerName,
      o.totalAmount,
      o.paymentMethod,
      o.paymentStatus
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BIR_Report_${startDate || 'All'}_to_${endDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-10 text-center">Loading reports...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header & Filters */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 BIR Sales & Tax Report</h1>
              <p className="text-sm text-gray-500 mt-1">Financial summary for tax filing (8% Income Tax Option).</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">From:</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">To:</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none" />
              </div>
              <button onClick={exportToCSV} className="bg-[#4A90E2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 transition-colors shadow-sm">
                ⬇ Export to CSV
              </button>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#dbeafe] p-5 rounded-2xl border border-blue-200 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Gross Sales</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">₱ {reportData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-gray-600 mt-2">Total sales before discounts.</p>
          </div>

          <div className="bg-[#fef3c7] p-5 rounded-2xl border border-yellow-200 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Total Discounts</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">₱ {reportData.discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-gray-600 mt-2">Total deductions applied.</p>
          </div>

          <div className="bg-[#dcfce7] p-5 rounded-2xl border border-green-200 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Net Sales (Taxable)</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">₱ {reportData.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-gray-600 mt-2">Final revenue after discounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ✅ BIR Tax Breakdown (8% Option) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">BIR Tax Breakdown (8% Option)</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Net Sales</span>
                <span className="font-medium">₱ {reportData.netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Less: Exempt Amount</span>
                <span>- ₱ 250,000.00</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-800 font-medium">Taxable Base</span>
                <span className="font-bold">₱ {reportData.taxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg mt-3">
                <span className="text-red-800 font-bold">8% Income Tax Due</span>
                <span className="font-bold text-red-600 text-lg">₱ {reportData.eightPercentTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Payment Methods Received</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                <span className="text-green-800 font-medium">Cash</span>
                <span className="font-bold text-green-900">₱ {reportData.cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-800 font-medium">GCash</span>
                <span className="font-bold text-blue-900">₱ {reportData.gcashTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg">
                <span className="text-purple-800 font-medium">Card</span>
                <span className="font-bold text-purple-900">₱ {reportData.cardTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-800">Transaction Details ({filteredOrders.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-200">
                <tr className="text-left text-gray-600">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Receipt No</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-3 font-mono text-[#4A90E2] font-medium">{order.receiptNo}</td>
                    <td className="p-3">{order.customerName}</td>
                    <td className="p-3 font-bold">₱ {Number(order.totalAmount).toLocaleString()}</td>
                    <td className="p-3">{order.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ReportsPage;