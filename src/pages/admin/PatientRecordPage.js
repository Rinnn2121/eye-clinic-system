// src/pages/admin/PatientRecordPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';

function PatientRecordPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Modal states
  const [showPrescriptionError, setShowPrescriptionError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');

  // ✅ Manual total override state
  const [isManualTotal, setIsManualTotal] = useState(false);

  const [record, setRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    firstName: '', lastName: '', nickname: '', address: '', age: '', phone: '', occupation: '',
    
    oldPd: '', newPd: '',
    oldODsph: '', oldODcyl: '', oldODaxis: '',
    oldOSsph: '', oldOScyl: '', oldOSaxis: '', oldADD: '',
    newODsph: '', newODcyl: '', newODaxis: '',
    newOSsph: '', newOScyl: '', newOSaxis: '', newADD: '',
    prescriptionNotes: '', additionalNotes: '',
    
    frame: '', 
    lensType: '',
    coating: '',
    
    total: 0, amountPaid: '', balance: 0,
    paymentStatus: 'pending', paymentMethod: 'Cash',
    optometrist: '',
  });

  // Load customer & inventory
  useEffect(() => {
    const load = async () => {
      try {
        const custSnap = await getDoc(doc(db, 'customers', customerId));
        if (custSnap.exists()) {
          const custData = { id: custSnap.id, ...custSnap.data() };
          setCustomer(custData);
          setRecord(prev => ({
            ...prev,
            firstName: custData.firstName || '', lastName: custData.lastName || '',
            nickname: custData.nickname || '', address: custData.address || '',
            age: custData.age || '', phone: custData.phone || '', occupation: custData.occupation || '',
          }));
        } else {
          setSaveError('Customer not found');
          setTimeout(() => navigate('/admin/customers'), 2000);
          return;
        }

        const invSnap = await getDocs(collection(db, 'inventory'));
        const invList = [];
        invSnap.forEach((d) => invList.push({ id: d.id, ...d.data() }));
        setInventory(invList);
        setLoading(false);
      } catch (err) {
        console.error(err); 
        setSaveError(err.message);
        setLoading(false);
      }
    };
    load();
  }, [customerId, navigate]);

  // Auto-calculate total
  useEffect(() => {
    if (isManualTotal) return; // Don't override if manually edited

    const f = inventory.find((i) => i.id === record.frame);
    const lt = inventory.find((i) => i.id === record.lensType);
    const c = inventory.find((i) => i.id === record.coating);
    
    const isPackage = f?.name?.toLowerCase().includes('package');
    
    let subtotal = 0;
    if (isPackage) {
      subtotal = f?.price || 0;
    } else {
      const framePrice = f?.price || 0;
      const lensPrice = (lt?.price || 0) + (c?.price || 0);
      subtotal = framePrice + lensPrice;
    }

    if (subtotal > 0) {
      setRecord((p) => ({ ...p, total: subtotal }));
    }
  }, [record.frame, record.lensType, record.coating, inventory, isManualTotal]);
    
  // Auto-calculate balance
  useEffect(() => {
    const paid = Number(record.amountPaid) || 0;
    const balance = record.total - paid;

    let calculatedStatus = 'pending';
    if (record.total > 0 && paid >= record.total) {
      calculatedStatus = 'paid';
    }

    setRecord((p) => ({ 
      ...p, 
      balance: balance > 0 ? balance : 0,
      paymentStatus: calculatedStatus
    }));
  }, [record.amountPaid, record.total]);

  const handleSave = async () => {
    if (!record.newODsph && !record.newOSsph) {
      setShowPrescriptionError(true); 
      return;
    }

    setSaving(true);
    try {
      const f = inventory.find((i) => i.id === record.frame);
      const lt = inventory.find((i) => i.id === record.lensType);
      const c = inventory.find((i) => i.id === record.coating);
      const generatedReceipt = `SO-${Date.now().toString().slice(-5)}`;
      const isPackage = f?.name?.toLowerCase().includes('package');

      // Update customer stats
            // ✅ Update customer stats AND latest transaction info for the Customers Table
      await updateDoc(doc(db, 'customers', customerId), {
        firstName: record.firstName, 
        lastName: record.lastName, 
        nickname: record.nickname,
        address: record.address, 
        age: record.age, 
        phone: record.phone, 
        occupation: record.occupation,
        lastVisit: new Date().toISOString(), 
        totalVisits: (customer.totalVisits || 0) + 1,
        
        // ✅ NEW: Save latest balance & payment info directly to the customer profile
        latestBalance: record.balance || 0,
        latestPaymentMethod: record.paymentMethod || 'Cash',
        latestPaymentStatus: record.paymentStatus || 'pending'
      });
      // Save record
      await addDoc(collection(db, 'records'), {
        customerId, customerName: `${record.lastName}, ${record.firstName}`, date: record.date,
        oldPd: record.oldPd, newPd: record.newPd,
        oldPrescription: {
          od: { sph: record.oldODsph, cyl: record.oldODcyl, axis: record.oldODaxis },
          os: { sph: record.oldOSsph, cyl: record.oldOScyl, axis: record.oldOSaxis }, add: record.oldADD,
        },
        newPrescription: {
          od: { sph: record.newODsph, cyl: record.newODcyl, axis: record.newODaxis },
          os: { sph: record.newOSsph, cyl: record.newOScyl, axis: record.newOSaxis }, add: record.newADD,
        },
        prescriptionNotes: record.prescriptionNotes, additionalNotes: record.additionalNotes,
        frame: f ? { id: f.id, name: f.name, price: f.price, isPackage } : null,
        lensType: lt ? { id: lt.id, name: lt.name, price: lt.price } : null,
        coating: c ? { id: c.id, name: c.name, price: c.price } : null,
        total: record.total,
        amountPaid: Number(record.amountPaid) || 0, balance: record.balance,
        paymentStatus: record.paymentStatus, paymentMethod: record.paymentMethod,
        optometrist: record.optometrist, createdBy: currentUser?.email, createdAt: new Date().toISOString(),
        receiptNo: generatedReceipt, // Save receiptNo to link with orders
      });

      // Save order
      await addDoc(collection(db, 'orders'), {
        receiptNo: generatedReceipt, 
        customerId, 
        customerName: `${record.lastName}, ${record.firstName}`,
        
        // ✅ NEW: Save contact info and notes for the modal
        customerPhone: record.phone, 
        notes: record.additionalNotes || record.prescriptionNotes || '',
        
        totalAmount: record.total, 
        amountPaid: Number(record.amountPaid) || 0, 
        balance: record.balance,
        
        // ✅ NEW: Save discount so the math looks correct in the modal
        discount: Number(record.discount) || 0, 
        
        paymentStatus: record.paymentStatus, 
        paymentMethod: record.paymentMethod, 
        orderDate: new Date().toISOString(),
        items: [
          ...(f ? [{ name: f.name, category: isPackage ? 'Package' : f.category, qty: 1, price: f.price }] : []),
          ...(!isPackage && lt ? [{ name: lt.name, category: 'Lens Type', qty: 1, price: lt.price }] : []),
          ...(!isPackage && c ? [{ name: c.name, category: 'Coating', qty: 1, price: c.price }] : []),
        ],
      });

      // Show success modal
      setReceiptNo(generatedReceipt);
      setShowSuccess(true);
    } catch (err) {
      console.error(err); 
      setSaveError(err.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">VITUG-SUMAYA</h1>
          <h2 className="text-xl font-bold">OPTICAL CLINIC</h2>
          <p className="text-sm text-gray-500 mt-1">PATIENT'S RECORD</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><input value={record.lastName} onChange={(e) => setRecord({ ...record, lastName: e.target.value })} className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /><p className="text-xs text-center mt-1">LAST NAME</p></div>
          <div><input value={record.firstName} onChange={(e) => setRecord({ ...record, firstName: e.target.value })} className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /><p className="text-xs text-center mt-1">FIRST NAME</p></div>
          <div><input value={record.nickname} onChange={(e) => setRecord({ ...record, nickname: e.target.value })} className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /><p className="text-xs text-center mt-1">NICKNAME</p></div>
        </div>

        <div className="mb-4"><div className="flex items-end gap-2"><span className="text-sm font-medium">ADDRESS:</span><input value={record.address} onChange={(e) => setRecord({ ...record, address: e.target.value })} className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /></div></div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-end gap-2"><span className="text-sm font-medium">AGE:</span><input value={record.age} onChange={(e) => setRecord({ ...record, age: e.target.value })} className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /></div>
          <div className="flex items-end gap-2"><span className="text-sm font-medium">CONTACT NO:</span><input value={record.phone} onChange={(e) => setRecord({ ...record, phone: e.target.value })} className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-end gap-2"><span className="text-sm font-medium">OCCUPATION:</span><input value={record.occupation} onChange={(e) => setRecord({ ...record, occupation: e.target.value })} className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none focus:border-[#4A90E2]" /></div>
          <div className="flex items-end gap-2"><span className="text-sm font-medium">DATE:</span><input type="date" value={record.date} onChange={(e) => setRecord({ ...record, date: e.target.value })} className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none" /></div>
        </div>

        {/* OLD PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-4 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px] bg-gray-50"><div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">PD</div><div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">OLD PRESCRIPTION</div><div className="p-2 text-center font-semibold text-xs">ADD</div></div>
          <div className="grid grid-cols-[80px_1fr_90px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2"><input type="text" value={record.oldPd} onChange={(e) => setRecord({ ...record, oldPd: e.target.value })} className="w-full text-center text-sm outline-none" placeholder="PD" /></div>
            <div className="border-r-2 border-gray-700 p-2"><div className="flex items-center gap-2"><span className="text-xs font-medium w-8">OD:</span><input value={record.oldODsph} onChange={(e) => setRecord({ ...record, oldODsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" /><input value={record.oldODcyl} onChange={(e) => setRecord({ ...record, oldODcyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" /><span className="text-xs">x</span><input value={record.oldODaxis} onChange={(e) => setRecord({ ...record, oldODaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" /></div></div>
            <div className="p-2 flex items-center justify-center"><input value={record.oldADD} onChange={(e) => setRecord({ ...record, oldADD: e.target.value })} className="w-full text-center text-sm outline-none" placeholder="ADD" /></div>
          </div>
          <div className="grid grid-cols-[80px_1fr_90px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2"></div>
            <div className="border-r-2 border-gray-700 p-2"><div className="flex items-center gap-2"><span className="text-xs font-medium w-8">OS:</span><input value={record.oldOSsph} onChange={(e) => setRecord({ ...record, oldOSsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" /><input value={record.oldOScyl} onChange={(e) => setRecord({ ...record, oldOScyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" /><span className="text-xs">x</span><input value={record.oldOSaxis} onChange={(e) => setRecord({ ...record, oldOSaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" /></div></div>
            <div className="p-2"></div>
          </div>
        </div>

        {/* NEW PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px] bg-gray-50"><div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">PD</div><div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">NEW PRESCRIPTION</div><div className="p-2 text-center font-semibold text-xs">ADD</div></div>
          <div className="grid grid-cols-[80px_1fr_90px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2"><input type="text" value={record.newPd} onChange={(e) => setRecord({ ...record, newPd: e.target.value })} className="w-full text-center text-sm outline-none" placeholder="PD" /></div>
            <div className="border-r-2 border-gray-700 p-2"><div className="flex items-center gap-2"><span className="text-xs font-medium w-8">OD:</span><input value={record.newODsph} onChange={(e) => setRecord({ ...record, newODsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" /><input value={record.newODcyl} onChange={(e) => setRecord({ ...record, newODcyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" /><span className="text-xs">x</span><input value={record.newODaxis} onChange={(e) => setRecord({ ...record, newODaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" /></div></div>
            <div className="p-2 flex items-center justify-center"><input value={record.newADD} onChange={(e) => setRecord({ ...record, newADD: e.target.value })} className="w-full text-center text-sm outline-none" placeholder="ADD" /></div>
          </div>
          <div className="grid grid-cols-[80px_1fr_90px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2"></div>
            <div className="border-r-2 border-gray-700 p-2"><div className="flex items-center gap-2"><span className="text-xs font-medium w-8">OS:</span><input value={record.newOSsph} onChange={(e) => setRecord({ ...record, newOSsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" /><input value={record.newOScyl} onChange={(e) => setRecord({ ...record, newOScyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" /><span className="text-xs">x</span><input value={record.newOSaxis} onChange={(e) => setRecord({ ...record, newOSaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" /></div></div>
            <div className="p-2"></div>
          </div>
        </div>

        {/* NOTES */}
        <div className="mb-6 space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prescription Notes / Remarks</label><textarea value={record.prescriptionNotes} onChange={(e) => setRecord({ ...record, prescriptionNotes: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" rows="2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label><input type="text" value={record.additionalNotes} onChange={(e) => setRecord({ ...record, additionalNotes: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" /></div>
        </div>

        {/* FRAME, LENS TYPE, & COATING SECTION */}
        <div className="space-y-3 mb-6">
          
          {inventory.find((i) => i.id === record.frame)?.name?.toLowerCase().includes('package') ? (
            <div className="flex items-end gap-2">
              <span className="text-sm font-medium w-20 text-[#4A90E2]">PACKAGE:</span>
              <select value={record.frame} onChange={(e) => setRecord({ ...record, frame: e.target.value, lensType: '', coating: '' })}
                className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent font-semibold text-[#4A90E2]">
                <option value="">Select Package</option>
                {inventory.filter((i) => i.name?.toLowerCase().includes('package')).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                ))}
                <option value="custom">--- Custom Frame & Lens ---</option>
              </select>
              {record.frame && record.frame !== 'custom' && (
                <button onClick={() => setRecord({ ...record, frame: '', lensType: '', coating: '' })} className="text-xs text-red-500 hover:underline">Clear</button>
              )}
            </div>
          ) : (
            <>
              {/* FRAME */}
              <div className="flex items-end gap-2">
                <span className="text-sm font-medium w-20">FRAME:</span>
                <select value={record.frame} onChange={(e) => setRecord({ ...record, frame: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent">
                  <option value="">Select frame</option>
                  
                  {/* Option for Customer's Own Frame */}
                  <option value="custom">👤 Customer's Own Frame (No Charge)</option>
                  
                  <optgroup label="📦 Packages (Frame + Lens)">
                    {inventory.filter((i) => i.name?.toLowerCase().includes('package')).map((i) => (
                      <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                    ))}
                  </optgroup>
                  <optgroup label="👓 Metal Frames">
                    {inventory.filter((i) => i.category === 'Metal Frame').map((i) => (
                      <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                    ))}
                  </optgroup>
                  <optgroup label="👓 Plastic Frames">
                    {inventory.filter((i) => i.category === 'Plastic Frame').map((i) => (
                      <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* LENS TYPE */}
              <div className="flex items-end gap-2">
                <span className="text-sm font-medium w-20">LENS TYPE:</span>
                <select value={record.lensType} onChange={(e) => setRecord({ ...record, lensType: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent">
                  <option value="">Select lens type</option>
                  {inventory.filter((i) => i.category === 'Lens Type').map((i) => (
                    <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                  ))}
                </select>
              </div>

              {/* COATING */}
              <div className="flex items-end gap-2">
                <span className="text-sm font-medium w-20">COATING:</span>
                <select value={record.coating} onChange={(e) => setRecord({ ...record, coating: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent">
                  <option value="">Select coating</option>
                  {inventory.filter((i) => i.category === 'Coating').map((i) => (
                    <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* PAYMENT SECTION */}
        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 border-t pt-2">
            <span className="text-sm font-bold w-20">TOTAL:</span>
            <div className="flex-1 flex items-center">
              <span className="text-lg font-bold mr-1">₱</span>
              <input
              type="number"
              value={record.total}
              onChange={(e) => {
                setIsManualTotal(true); // ✅ Override auto-calc
                setRecord({ ...record, total: Number(e.target.value)});
              }}
              className="w-full text-lg font-bold outline-none bg-transparent border-b border-gray-300 focus:border-[#4A90E2]"
              />
               </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-20 text-gray-600">AMOUNT PAID:</span>
            <input type="number" value={record.amountPaid} onChange={(e) => setRecord({ ...record, amountPaid: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent" placeholder="0" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-20 text-gray-600">BALANCE:</span>
            <span className="flex-1 text-sm font-semibold text-red-600">₱{record.balance.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">PAYMENT METHOD:</span>
              <select value={record.paymentMethod} onChange={(e) => setRecord({ ...record, paymentMethod: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]">
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">STATUS:</span>
              <select 
                value={record.paymentStatus} 
                disabled 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
              >
                <option value="pending">Pending (May Balance)</option>
                <option value="paid">Fully Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-8">
          <span className="text-sm font-medium">OPTOMETRIST:</span>
          <input value={record.optometrist} onChange={(e) => setRecord({ ...record, optometrist: e.target.value })}
            className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/customers')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save & Print'}</button>
        </div>
      </div>

      {/* ✅ MODALS */}
      <ConfirmModal
        isOpen={showPrescriptionError}
        title="Missing Prescription"
        message="Please enter at least the new prescription SPH for OD or OS."
        icon="⚠️"
        confirmText="OK"
        confirmColor="red"
        isAlert
        onConfirm={() => setShowPrescriptionError(false)}
      />

      <ConfirmModal
        isOpen={!!saveError}
        title="Save Failed"
        message={saveError}
        icon="❌"
        confirmText="OK"
        confirmColor="red"
        isAlert
        onConfirm={() => setSaveError('')}
      />

      <ConfirmModal
        isOpen={showSuccess}
        title="Record Saved!"
        message={`Receipt No: ${receiptNo}\nThe record has been successfully saved.`}
        icon="✅"
        confirmText="Go to Customers"
        confirmColor="green"
        isAlert
        onConfirm={() => {
          setShowSuccess(false);
          navigate('/admin/customers');
        }}
      />
    </div>
  );
}

export default PatientRecordPage;