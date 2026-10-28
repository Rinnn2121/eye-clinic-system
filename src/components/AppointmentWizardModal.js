// src/components/AppointmentWizardModal.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AddCustomerModal from '../pages/admin/AddCustomerModal'; 

export default function AppointmentWizardModal({ onClose, onSuccess }) {
  const [modalStep, setModalStep] = useState(1); // 1, 2, 3, 4
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0],
    time: '09:00',
    reason: 'Eye Examination',
    note: ''
  });

  // Fetch customers when reaching Step 2
  useEffect(() => {
    if (modalStep === 2) {
      const fetchCustomers = async () => {
        const snap = await getDocs(collection(db, 'customers'));
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setAllCustomers(list);
      };
      fetchCustomers();
    }
  }, [modalStep]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...formData,
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  // Filter for Step 2 search
  const filteredCustomers = allCustomers.filter(c => 
    c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none transition-colors">
            &times;
          </button>
        </div>

        {/* ✅ Stepper - Updated to only highlight the ACTIVE step */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-center gap-2 text-xs md:text-sm font-medium">
          
          <div className={`flex items-center gap-1 ${modalStep === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep === 1 ? 'border-blue-600' : 'border-gray-300'}`}>1</span> 
            Customer Type
          </div>
          <span className="text-gray-300">→</span>

          <div className={`flex items-center gap-1 ${modalStep === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep === 2 ? 'border-blue-600' : 'border-gray-300'}`}>2</span> 
            Customer Info
          </div>
          <span className="text-gray-300">→</span>

          <div className={`flex items-center gap-1 ${modalStep === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep === 3 ? 'border-blue-600' : 'border-gray-300'}`}>3</span> 
            Appointment Details
          </div>
          <span className="text-gray-300">→</span>

          <div className={`flex items-center gap-1 ${modalStep === 4 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${modalStep === 4 ? 'border-blue-600' : 'border-gray-300'}`}>4</span> 
            Confirm
          </div>

        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1 */}
          {modalStep === 1 && (
            <div>
              <p className="text-gray-600 mb-6">Select if the customer is new or a returning customer.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => setIsAddingNew(true)} className="group border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all">
                  <div className="text-gray-700 group-hover:text-blue-600 mb-4 transition-colors">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">New Customer</h3>
                  <p className="text-sm text-gray-500 mb-6">Register a new customer and create an appointment.</p>
                  <div className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium group-hover:bg-blue-700">Continue</div>
                </div>
                <div onClick={() => setModalStep(2)} className="group border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all">
                  <div className="text-gray-700 group-hover:text-blue-600 mb-4 transition-colors">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Returning Customer</h3>
                  <p className="text-sm text-gray-500 mb-6">Choose from existing customers in your list.</p>
                  <div className="w-full bg-white border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium group-hover:bg-blue-50">Continue</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Info */}
          {modalStep === 2 && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-4">Select customer</h3>
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" placeholder="Search by customer name, phone no..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90E2] outline-none" />
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-[#f3e8ff] grid grid-cols-12 gap-2 p-3 text-xs font-bold text-gray-700 uppercase">
                  <div className="col-span-5">Customer Name</div>
                  <div className="col-span-4">Phone Number</div>
                  <div className="col-span-3">Last Visit</div>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`grid grid-cols-12 gap-2 p-3 text-sm cursor-pointer items-center ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className="col-span-5 flex items-center gap-2 font-medium text-gray-800">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCustomer?.id === customer.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {selectedCustomer?.id === customer.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="col-span-4 text-gray-500">{customer.phone || 'N/A'}</div>
                      <div className="col-span-3 text-gray-500">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '—'}</div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && <p className="text-center text-gray-500 py-4">No customers found.</p>}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setModalStep(1)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                <button onClick={() => setModalStep(3)} disabled={!selectedCustomer} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}

          {/* STEP 3: Appointment Details */}
          {modalStep === 3 && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Appointment Details</h3>
              <p className="text-sm text-gray-500 mb-6">Set the date, time and service for the appointment.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] bg-white">
                    <option value="Eye Examination">Eye Examination</option>
                    <option value="Dry Eye Test">Dry Eye Test</option>
                    <option value="Color Vision Test">Color Vision Test</option>
                    <option value="Contact Lens Fitting">Contact Lens Fitting</option>
                    <option value="Prescribing">Prescribing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                  <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} rows="2" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none"></textarea>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setModalStep(2)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                <button onClick={() => setModalStep(4)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Next</button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirm */}
          {modalStep === 4 && (
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Confirm Appointment</h3>
              <p className="text-sm text-gray-500 mb-6">Please review the details before confirming.</p>
              <div className="bg-gray-100 rounded-xl p-6 flex flex-col md:flex-row gap-8 mb-8 border border-gray-200">
                <div className="flex gap-4 items-start flex-1">
                  <div className="text-gray-600 mt-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer?.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="w-px bg-gray-300 hidden md:block"></div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                      <p className="font-semibold text-gray-800 text-sm">{new Date(formData.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} • {new Date(`2000-01-01T${formData.time}`).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Service</p>
                      <p className="font-semibold text-gray-800 text-sm">{formData.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button onClick={() => setModalStep(3)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Back</button>
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Confirm Appointment'}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Nested Modal for New Customer */}
      {isAddingNew && (
        <AddCustomerModal 
          onClose={(startVisitId) => {
            setIsAddingNew(false);
            if (startVisitId) {
              setModalStep(2);
            } else {
              setModalStep(1);
            }
          }}
          onCustomerCreated={() => {}}
        />
      )}
    </div>
  );
}