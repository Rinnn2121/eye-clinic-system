// src/components/QuickServiceInvoiceModal.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function QuickServiceInvoiceModal({ onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ 1. State for Multiple Services
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentServiceId, setCurrentServiceId] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
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

  // ✅ 2. Handler to add a service to the list
  const handleAddService = () => {
    if (!currentServiceId) return;
    const serviceToAdd = services.find(s => s.id === currentServiceId);
    
    // Check if it's already in the list
    if (selectedServices.some(s => s.id === currentServiceId)) {
      alert("This service is already added.");
      return;
    }

    setSelectedServices([
      ...selectedServices, 
      { 
        ...serviceToAdd, 
        customTotal: serviceToAdd.price // Allow editing price per service if needed
      }
    ]);
    setCurrentServiceId(''); // Reset dropdown
  };

  const handleRemoveService = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleServicePriceChange = (index, newPrice) => {
    const updated = [...selectedServices];
    updated[index].customTotal = Number(newPrice);
    setSelectedServices(updated);
  };

  // Calculate Totals
  const finalTotal = selectedServices.reduce((sum, service) => sum + (Number(service.customTotal) || 0), 0);
  const amountPaidNum = Number(formData.amountPaid) || 0;
  const isPartial = amountPaidNum < finalTotal && amountPaidNum > 0;
  const balance = finalTotal - amountPaidNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) return alert("Please add at least one service.");
    
    setSaving(true);
    try {
      const generatedReceipt = `SRV-${Date.now().toString().slice(-5)}`; 
      
      // Map the selected services to the order items format
      const orderItems = selectedServices.map(srv => ({
        name: srv.name,
        category: 'Service',
        qty: 1,
        price: Number(srv.customTotal)
      }));

      await addDoc(collection(db, 'orders'), {
        receiptNo: generatedReceipt,
        customerName: formData.customerName || 'Walk-in Patient',
        customerId: 'walk-in',
        customerPhone: '',
        notes: `Service Only: ${selectedServices.map(s => s.name).join(', ')}`,
        totalAmount: finalTotal, 
        amountPaid: amountPaidNum,
        balance: balance > 0 ? balance : 0,
        paymentStatus: balance <= 0 ? 'paid' : 'pending',
        paymentMethod: formData.paymentMethod,
        orderDate: new Date().toISOString(),
        items: orderItems,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  // Helper to prevent negative typing
  const preventNegative = (e) => {
    if (e.key === '-' || e.key === 'e') e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Service Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
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

          {/* ✅ Multiple Services Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-bold text-gray-800 mb-2">Availed Services *</label>
            
            {/* Selected Services List */}
            {selectedServices.length > 0 && (
              <div className="space-y-2 mb-4">
                {selectedServices.map((srv, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{srv.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                        <input 
                          type="number" 
                          min="0"
                          onKeyDown={preventNegative}
                          value={srv.customTotal} 
                          onChange={(e) => handleServicePriceChange(index, e.target.value)} 
                          className="w-full border border-gray-300 rounded-lg pl-6 pr-2 py-1 text-sm font-bold text-blue-900 outline-none focus:ring-1 focus:ring-[#4A90E2]" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveService(index)}
                        className="text-red-400 hover:text-red-600 font-bold text-xl leading-none px-1"
                        title="Remove Service"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Service Dropdown */}
            <div className="flex gap-2">
              <select 
                value={currentServiceId} 
                onChange={(e) => setCurrentServiceId(e.target.value)} 
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#4A90E2]"
              >
                <option value="">-- Select a Service to Add --</option>
                {loading ? (
                  <option disabled>Loading services...</option>
                ) : (
                  services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — ₱{s.price}</option>
                  ))
                )}
              </select>
              <button 
                type="button" 
                onClick={handleAddService}
                disabled={!currentServiceId}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-lg font-bold text-gray-900">
                ₱ {finalTotal.toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
              <input 
                min="0"
                onKeyDown={preventNegative}
                type="number" 
                required
                value={formData.amountPaid} 
                onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-[#4A90E2]" 
                placeholder="0"
              />
            </div>
          </div>

          {/* Optional: Show a subtle text if partial */}
          {isPartial && (
            <p className="text-xs text-orange-600 font-medium text-right mt-1">
              Remaining balance to be collected: ₱{balance.toLocaleString()}
            </p>
          )}

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

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button 
              type="submit" 
              disabled={saving || selectedServices.length === 0} 
              className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 