// src/components/BookingWizardModal.js

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookingWizardModal({ onClose, onSuccess, initialService }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); 

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // ✅ Store existing appointments for overlap check
  const [existingAppts, setExistingAppts] = useState([]);

  // Step 1 State
  const [visitTypes, setVisitTypes] = useState(
    initialService ? [initialService] : ['Eye Examination']
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('09:00'); // Default to 9 AM

  // Step 2 State
  const [includedItems, setIncludedItems] = useState([]);

  // Calendar Helper
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Fetch the user's cart on load
  useEffect(() => {
    const fetchCart = async () => {
      if (!currentUser?.email) return;
      const cartRef = doc(db, 'carts', currentUser.email);
      const snap = await getDoc(cartRef);
      if (snap.exists()) {
        const items = snap.data().items || [];
        setCartItems(items);
        setIncludedItems(items.filter(i => i.isActive !== false).map(i => i.id));
      }
    };
    fetchCart();
  }, [currentUser]);

  // ✅ Fetch existing appointments for the selected date
  useEffect(() => {
    const fetchExistingAppts = async () => {
      if (!selectedDate) return;
      
      const q = query(collection(db, 'appointments'), where('date', '==', selectedDate));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'Cancelled' && data.status !== 'Completed') {
          list.push(data);
        }
      });
      setExistingAppts(list);
    };
    fetchExistingAppts();
  }, [selectedDate]);

  // Handle Quantity Change
  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  // Toggle Service Selection
  const toggleService = (serviceId) => {
    if (visitTypes.includes(serviceId)) {
      setVisitTypes(visitTypes.filter(id => id !== serviceId));
    } else {
      setVisitTypes([...visitTypes, serviceId]);
    }
  };

  // ✅ Helper: Check if time is in the past today
  const isTimePast = () => {
    if (selectedDate !== getTodayStr()) return false;

    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5); // e.g. "14:30"
    return selectedTime < currentTimeStr;
  };

  // ✅ Helper: Check for 30-min overlap
  const isTimeSlotTaken = () => {
    if (!selectedTime || existingAppts.length === 0) return false;

    const [selHours, selMins] = selectedTime.split(':').map(Number);
    const selectedTimeInMins = selHours * 60 + selMins;

    for (const appt of existingAppts) {
      if (!appt.time) continue;
      
      const [existHours, existMins] = appt.time.split(':').map(Number);
      const existTimeInMins = existHours * 60 + existMins;

      if (Math.abs(selectedTimeInMins - existTimeInMins) < 30) {
        return true;
      }
    }
    return false;
  };

  const handleConfirm = async () => {
    setErrorMsg('');

    if (visitTypes.length === 0) {
      setErrorMsg("Please select at least one service.");
      return;
    }
    if (!selectedDate || selectedDate < getTodayStr()) {
      setErrorMsg("Please select a valid future date.");
      return;
    }
    if (isTimePast()) {
      setErrorMsg("The selected time has already passed today. Please choose a future time.");
      return;
    }
    if (isTimeSlotTaken()) {
      setErrorMsg("This time slot is already booked. Please pick a time at least 30 minutes away from existing appointments.");
      return;
    }

    setLoading(true);
    try {
      const selectedCartItems = cartItems.filter(item => includedItems.includes(item.id));
      
      // 1. Save Appointment
      await addDoc(collection(db, 'appointments'), {
        customerId: currentUser.email,
        customerName: currentUser.email.split('@')[0],
        date: selectedDate,
        time: selectedTime,
        reason: visitTypes.join(', '), 
        status: 'Pending',
        createdAt: new Date().toISOString(),
        interestedItems: selectedCartItems.map(item => ({
          name: item.name,
          price: item.price,
          color: item.color,
          qty: item.quantity
        }))
      });

      // 2. Notify Admin
      await addDoc(collection(db, 'notifications'), {
        recipient: 'admin', 
        type: 'booking',
        title: 'New Appointment Booked',
        message: `${currentUser.email.split('@')[0]} booked a ${visitTypes.join(', ')} on ${selectedDate} at ${selectedTime}.`,
        link: '/admin/appointments',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // 3. Notify Customer
      await addDoc(collection(db, 'notifications'), {
        recipient: currentUser.email,
        type: 'booking',
        title: 'Booking Confirmed',
        message: `Your appointment for ${visitTypes.join(', ')} on ${selectedDate} at ${selectedTime} is now pending confirmation.`,
        link: '/customer/appointments',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      setShowSuccessModal(true);

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to book appointment. Please try again.");
    }
    setLoading(false);
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  const formatDate = (day) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const servicesList = [
    { id: 'Eye Examination', desc: 'Check your eye vision and health.' },
    { id: 'Fitting of Contact Lenses', desc: 'Ensure proper fit and comfort.' },
    { id: 'Dry Eye Test', desc: 'Evaluate dry eye symptoms.' },
    { id: 'Color Vision Test', desc: 'Check color perception.' },
    { id: 'Prescribing/Dispensing of Corrective Lenses and Eyeglasses', desc: 'Get your new prescription or glasses.' },
    { id: 'Computerized Eye Examination', desc: 'Fast and accurate digital eye check.' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl my-8">
        
        {/* Header & Stepper */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 ? 'Book an Appointment' : step === 2 ? 'Select Items in Cart' : 'Review Booking'}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 1 ? 'Choose your visit details below.' : 
                 step === 2 ? 'You can continue without selecting any product.' : 
                 'Please check your details before confirming.'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none">&times;</button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className={`flex items-center gap-1 ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${step === 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</span> Select Visit and Date
            </div>
            <span className="text-gray-300">→</span>
            <div className={`flex items-center gap-1 ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${step === 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</span> Select Items in Cart
            </div>
            <span className="text-gray-300">→</span>
            <div className={`flex items-center gap-1 ${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${step === 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</span> Review Booking
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-gray-50/50">
          
          {/* STEP 1: Visit & Date */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left: Visit Type (Checkboxes) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">What would you like to visit us for? <span className="text-xs font-normal text-gray-500">(Select all that apply)</span></h3>
                <div className="space-y-3">
                  {servicesList.map(service => {
                    const isChecked = visitTypes.includes(service.id);
                    return (
                      <div 
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-gray-800 text-sm leading-tight">{service.id}</p>
                          <p className="text-xs text-gray-500 mt-1">{service.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Calendar & Time Input */}
              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Select Date</h3>
                
                <div className="flex justify-between items-center mb-3">
                  <button onClick={handlePrevMonth} className="text-gray-500 hover:text-gray-800 px-2">&lt;</button>
                  <div className="flex gap-2 text-sm font-medium">
                    <span>{currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}</span>
                  </div>
                  <button onClick={handleNextMonth} className="text-gray-500 hover:text-gray-800 px-2">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-gray-400 font-medium">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-6">
                  {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dateStr = formatDate(day);
                    const isSelected = selectedDate === dateStr;
                    const isPast = dateStr < getTodayStr();

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr)}
                        disabled={isPast}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                          isPast 
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                            : isSelected 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* ✅ Time Input Field instead of buttons */}
                <h3 className="font-bold text-gray-800 mb-3">Select Time</h3>
                <div>
                  <input 
                    type="time" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2] ${
                      (isTimePast() || isTimeSlotTaken()) && selectedDate
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-300'
                    }`}
                  />
                  {/* Inline warnings */}
                  {isTimePast() && selectedDate && (
                    <p className="text-xs text-red-500 mt-2 font-medium">This time has already passed today.</p>
                  )}
                  {isTimeSlotTaken() && !isTimePast() && selectedDate && (
                    <p className="text-xs text-red-500 mt-2 font-medium">This time is already booked. Please pick a time at least 30 mins away.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Select Items */}
          {step === 2 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">Your cart is empty. You can still book a service-only appointment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">🖼️</div>}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">Color: {item.color || 'Standard'}</p>
                        <p className="font-bold text-gray-900 mt-1">₱ {Number(item.price).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center border border-gray-300 h-8 w-24 text-xs">
                          <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="px-2 h-full text-gray-600 hover:bg-gray-50">-</button>
                          <span className="flex-1 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="px-2 h-full text-gray-600 hover:bg-gray-50">+</button>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={includedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setIncludedItems([...includedItems, item.id]);
                              else setIncludedItems(includedItems.filter(id => id !== item.id));
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          Include
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 bg-[#d0e2fd] text-blue-900 p-4 rounded-md flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-xs leading-relaxed">
                  Items in your cart will be shared with the clinic to help prepare for your visit. 
                  This does NOT represent an online purchase.
                </p>
              </div>
            </div>
          )}

                    {/* STEP 3: Review */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ✅ Show Error Message */}
              {errorMsg && (
                <div className="md:col-span-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Appointment Details</h3>
                    <button onClick={() => setStep(1)} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">✎ Edit</button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex"><span className="w-24 text-gray-500">Services</span><span className="font-medium text-gray-900">{visitTypes.join(', ')}</span></div>
                    <div className="flex"><span className="w-24 text-gray-500">Date</span><span className="font-medium text-gray-900">{selectedDate}</span></div>
                    <div className="flex"><span className="w-24 text-gray-500">Time</span><span className="font-medium text-gray-900">{selectedTime}</span></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">Products Included</h3>
                  {includedItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No products included.</p>
                  ) : (
                    <div className="space-y-3">
                      {cartItems.filter(item => includedItems.includes(item.id)).map(item => (
                         <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-16 h-16 bg-gray-200 flex-shrink-0">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">🖼️</div>}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-500">Color: {item.color || 'Standard'}</p>
                              <p className="font-bold text-gray-900 mt-1">₱ {Number(item.price).toLocaleString()}</p>
                            </div>
                            <div className="text-sm font-medium text-gray-700">Qty: {item.quantity}</div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm text-gray-700 mb-6 border-b border-gray-200 pb-4">
                  <div className="flex justify-between"><span>Services</span><span className="font-medium text-right max-w-[150px] text-xs">{visitTypes.join(', ')}</span></div>
                  <div className="flex justify-between"><span>Date</span><span className="font-medium">{selectedDate}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="font-medium">{selectedTime}</span></div>
                </div>
                
                <h4 className="font-bold text-gray-900 text-sm mb-2">Selected Frames</h4>
                <p className="text-sm text-gray-500 mb-6">
                  {includedItems.length > 0 ? `${includedItems.length} items selected` : 'None'}
                </p>

                <div className="bg-[#d0e2fd] text-blue-900 p-3 rounded-lg mb-6 text-xs flex gap-2">
                  <span>ℹ️</span>
                  <p>No payment or order delivery is placed online. Payment process is handled at the clinic.</p>
                </div>

                <button 
                  onClick={handleConfirm}
                  disabled={loading || isTimePast() || isTimeSlotTaken() || !selectedDate}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-gray-100 flex justify-between bg-white rounded-b-xl">
          <button 
            onClick={() => step === 1 ? onClose() : setStep(step - 1)} 
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-50"
          >
            {step === 1 ? 'Cancel' : 'Go Back'}
          </button>
          
          {step < 3 && (
            <button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (visitTypes.length === 0 || !selectedDate || isTimePast() || isTimeSlotTaken() || !selectedTime)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Continue
            </button>
          )}
        </div>

      </div>

      {/* ✅ SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
            
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-500 mb-8">
              Your appointment has been successfully scheduled. We look forward to seeing you at the clinic.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  onSuccess(); 
                  navigate('/customer/appointments'); 
                  onClose(); 
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                View My Appointments
              </button>
              
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  onSuccess(); 
                  onClose(); 
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}