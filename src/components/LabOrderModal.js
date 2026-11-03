// src/components/LabOrderModal.js

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function LabOrderModal({ record, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  
  // ✅ Use optional chaining so it doesn't crash if record is undefined
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    patientName: record?.customerName || '',
    frameCategory: record?.frameCategory || '',
    specificFrame: '',
    lens: record?.lensType || '',
    tint: record?.coating || '',
    od: `Sph: ${record?.newODsph || ''} / Cyl: ${record?.newODcyl || ''} / Axis: ${record?.newODaxis || ''}`,
    os: `Sph: ${record?.newOSsph || ''} / Cyl: ${record?.newOScyl || ''} / Axis: ${record?.newOSaxis || ''}`,
    add: record?.newADD || '',
    pd: record?.newPd || '',
    balance: `₱ ${Number(record?.balance || 0).toLocaleString()}`,
    notes: ''
  });

  // ✅ Safe guard AFTER hooks
  if (!record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
       const orderData = {
        patientName: record.customerName,
        date: formData.date,
        frameCategory: record.frameCategory,
        specificFrame: formData.specificFrame, // ✅ Save specific frame
        lens: formData.lens,
        tint: formData.tint,
        od: formData.od,
        os: formData.os,
        add: formData.add,
        pd: formData.pd,
        notes: formData.notes, // ✅ Save instructions
        patientId: record.customerId,
        recordId: record.id,
        totalAmount: record.totalAmount,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'labOrders'), orderData);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save lab order:", err);
      alert("Failed to send to lab. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 uppercase">Vitug-Sumaya Optical Clinic</h2>
            <p className="text-sm font-bold text-gray-500 tracking-widest uppercase">Laboratory Copy</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Patient Name</label>
              <input 
                type="text" readOnly value={formData.patientName}
                className="w-full border-b-2 border-gray-300 pb-1 text-lg font-bold text-gray-900 outline-none bg-transparent"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
              <input 
                type="date" required value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full border-b-2 border-gray-300 pb-1 text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Specific Frame Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Frame Category</label>
              <input 
                type="text" readOnly value={formData.frameCategory}
                className="w-full border-b-2 border-gray-300 pb-1 text-sm font-bold text-gray-500 bg-gray-50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A90E2] uppercase mb-1">Specific Frame (Brand/Model) *</label>
              <input 
                type="text" required value={formData.specificFrame}
                onChange={(e) => setFormData({...formData, specificFrame: e.target.value})}
                className="w-full border-b-2 border-[#4A90E2] pb-1 text-sm font-bold text-gray-900 outline-none"
                placeholder="e.g., Ray-Ban RB2140"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Lens</label>
                <input 
                  type="text" readOnly value={formData.lens}
                  className="w-full border-b border-gray-400 pb-1 text-sm outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tint / Coating</label>
                <input 
                type="text" 
                value={formData.tint}
                onChange={(e) => setFormData({...formData, tint: e.target.value})}
                className="w-full border-b-2 border-gray-300 pb-1 text-sm outline-none focus:border-[#4A90E2]"
              />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Instructions / Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full h-[100px] border-2 border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-[#4A90E2] resize-none"
                placeholder="Special instructions for the lab..."
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-[60px_1fr] items-center gap-2">
              <span className="text-sm font-bold text-gray-700">OD:</span>
              <input 
                type="text" value={formData.od}
                onChange={(e) => setFormData({...formData, od: e.target.value})}
                className="w-full border-b border-gray-400 pb-1 text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-2">
              <span className="text-sm font-bold text-gray-700">OS:</span>
              <input 
                type="text" value={formData.os}
                onChange={(e) => setFormData({...formData, os: e.target.value})}
                className="w-full border-b border-gray-400 pb-1 text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                <span className="text-sm font-bold text-gray-700">ADD:</span>
                <input 
                  type="text" value={formData.add}
                  onChange={(e) => setFormData({...formData, add: e.target.value})}
                  className="w-full border-b border-gray-400 pb-1 text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                <span className="text-sm font-bold text-gray-700">PD:</span>
                <input 
                  type="text" value={formData.pd}
                  onChange={(e) => setFormData({...formData, pd: e.target.value})}
                  className="w-full border-b border-gray-400 pb-1 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">BALANCE:</span>
              <span className="text-lg font-bold text-red-600">{formData.balance}</span>
            </div>
            
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-[#4A90E2] text-white rounded-lg text-sm font-bold hover:bg-[#4A90E2]/90 disabled:opacity-50">
                {saving ? 'Sending...' : 'Send to Lab'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}