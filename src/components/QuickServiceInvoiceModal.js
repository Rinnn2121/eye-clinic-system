// src/components/QuickServiceInvoiceModal.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function QuickServiceInvoiceModal({ onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    serviceId: '',
    customTotal: '', // ✅ Editable total state
    amountPaid: '',
    paymentMethod: 'Cash'
  });

  // Fetch only items categorized as 'Service'
  useEffect(() => {
    const fetchServices = async () => {
      const snap = await getDocs(collection(db, 'inventory'));
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.category === 'Service') {
          list.push({ id: doc.id, ...data });
        }
      });
      setServices(list);
      setLoading(false);
    };
    fetchServices();
  }, []);

  // Auto-fill total when a service is selected
  useEffect(() => {
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (selectedService) {
      setFormData(prev => ({ ...prev, customTotal: selectedService.price }));
    } else {
      setFormData(prev => ({ ...prev, customTotal: '' }));
    }
  }, [formData.serviceId, services]);

  const selectedService = services.find(s => s.id === formData.serviceId);
  const finalTotal = Number(formData.customTotal) || 0;
  const balance = finalTotal - (Number(formData.amountPaid) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceId) return alert("Please select a service");
    
    setSaving(true);
    try {
      const generatedReceipt = `SRV-${Date.now().toString().slice(-5)}`; 
      
      await addDoc(collection(db, 'orders'), {
        receiptNo: generatedReceipt,
        customerName: formData.customerName || 'Walk-in Patient',
        customerId: 'walk-in',
        customerPhone: '',
        notes: `Service Only: ${selectedService.name}`,
        totalAmount: finalTotal, // ✅ Uses the editable total
        amountPaid: Number(formData.amountPaid) || 0,
        balance: balance > 0 ? balance : 0,
        paymentStatus: balance <= 0 ? 'paid' : 'pending',
        paymentMethod: formData.paymentMethod,
        orderDate: new Date().toISOString(),
        items: [
          { 
            name: selectedService.name, 
            category: 'Service', 
            qty: 1, 
            price: finalTotal // ✅ Saves the editable total
          }
        ],
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Service Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
            <input 
              type="text" 
              value={formData.customerName} 
              onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" 
              placeholder="Walk-in Patient" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Service *</label>
            <select 
              required
              value={formData.serviceId} 
              onChange={(e) => setFormData({...formData, serviceId: e.target.value})} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#4A90E2]"
            >
              <option value="">-- Choose a Service --</option>
              {loading ? (
                <option disabled>Loading services...</option>
              ) : (
                services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ₱{s.price}</option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (Editable)</label>
              {/* ✅ Editable Total Input */}
              <input 
                type="number" 
                required
                value={formData.customTotal} 
                onChange={(e) => setFormData({...formData, customTotal: e.target.value})} 
                className="w-full border border-blue-300 bg-blue-50 rounded-lg px-4 py-2 text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-[#4A90E2]" 
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
              <input 
                type="number" 
                required
                value={formData.amountPaid} 
                onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" 
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select 
                value={formData.paymentMethod} 
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#4A90E2]"
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <div className={`w-full border rounded-lg px-4 py-2 text-sm font-bold ${balance > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                ₱ {balance > 0 ? balance.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}