// src/pages/admin/PatientRecordPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, getDocs, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import LabOrderModal from '../../components/LabOrderModal';

// ✅ Base prices
const FRAME_TYPES = {
  'Plastic': 900,
  'Metal': 1500,
  'Branded': 2500,
  'Own Frame': 0,
  'Custom': 0,
};

const LENS_TYPES = ['Single Vision', 'Kryptok', 'Progressive', 'Custom'];
const COATING_TYPES = [
  'Ordinary', 
  'Multicoated', 
  'Blue Blocker', 
  'Photochromic', 
  'Photochromic Blue Blocker', 
  'Photochromic Multicoated',
  'Custom'
];

function PatientRecordPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showPrescriptionError, setShowPrescriptionError] = useState(false);
  const [showSelectionError, setShowSelectionError] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Lab Modal State
  const [showLabModal, setShowLabModal] = useState(false);
  const [savedRecordForLab, setSavedRecordForLab] = useState(null);

  const [record, setRecord] = useState({
    date: new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0],
    firstName: '', lastName: '', nickname: '', address: '', age: '', phone: '', occupation: '',
    
    oldPd: '', newPd: '',
    oldODsph: '', oldODcyl: '', oldODaxis: '',
    oldOSsph: '', oldOScyl: '', oldOSaxis: '', oldADD: '',
    newODsph: '', newODcyl: '', newODaxis: '',
    newOSsph: '', newOScyl: '', newOSaxis: '', newADD: '',
    prescriptionNotes: '', additionalNotes: '',
    
    frameText: '', 
    lensText: '',  
    coatingText: '', 
    
    customFrame: '',
    customLens: '',
    customCoating: '',
    
    total: 0, deposit: '', balance: 0,
    paymentStatus: 'pending', paymentMethod: 'Cash',
    optometrist: '',
    
    isManualTotal: false,
  });

  // Load customer and previous record
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

        const prevRecordsQuery = query(
          collection(db, 'records'),
          where('customerId', '==', customerId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const prevRecordsSnap = await getDocs(prevRecordsQuery);
        
        if (!prevRecordsSnap.empty) {
          const lastRecord = prevRecordsSnap.docs[0].data();
          const lastNewRx = lastRecord.newPrescription || {};
          
          setRecord(prev => ({
            ...prev,
            oldPd: lastRecord.newPd || '',
            oldODsph: lastNewRx.od?.sph || '',
            oldODcyl: lastNewRx.od?.cyl || '',
            oldODaxis: lastNewRx.od?.axis || '',
            oldOSsph: lastNewRx.os?.sph || '',
            oldOScyl: lastNewRx.os?.cyl || '',
            oldOSaxis: lastNewRx.os?.axis || '',
            oldADD: lastNewRx.add || '',
          }));
        }

        setLoading(false);
      } catch (err) {
        console.error(err); 
        setSaveError(err.message);
        setLoading(false);
      }
    };
    load();
  }, [customerId, navigate]);

  // ✅ Auto-calculate total based on Frame Type
  useEffect(() => {
    if (record.isManualTotal) return;
    if (record.frameText === 'Custom' || record.frameText === 'Own Frame') return; 

    const basePrice = FRAME_TYPES[record.frameText] || 0;
    setRecord(p => ({ ...p, total: basePrice }));
  }, [record.frameText, record.isManualTotal]);

  // Auto-calculate balance based on Deposit
  useEffect(() => {
    const deposited = Number(record.deposit) || 0;
    const balance = record.total - deposited;

    let calculatedStatus = 'pending';
    if (record.total > 0 && deposited >= record.total) {
      calculatedStatus = 'paid';
    }

    setRecord((p) => ({ 
      ...p, 
      balance: balance > 0 ? balance : 0,
      paymentStatus: calculatedStatus
    }));
  }, [record.deposit, record.total]);

  

  const handleSave = async () => {

    if (Number(record.total) < 0 || Number(record.deposit) < 0) {
      setSaveError("Total and deposit cannot be negative.");
      return;
    }
    if (!record.newODsph && !record.newOSsph) {
      setShowPrescriptionError(true); 
      return;
    }

    // Validation: Must select Lens and Coating
    if (!record.lensText || !record.coatingText) {
      setShowSelectionError(true);
      return;
    }

    if (record.frameText === 'Custom' && !record.customFrame) {
      setShowSelectionError(true);
      return;
    }
    if (record.lensText === 'Custom' && !record.customLens) {
      setShowSelectionError(true);
      return;
    }
    if (record.coatingText === 'Custom' && !record.customCoating) {
      setShowSelectionError(true);
      return;
    }

    setSaving(true);
    try {
      const generatedReceipt = `SO-${Date.now().toString().slice(-5)}`;
      
      const finalFrame = record.frameText === 'Custom' ? record.customFrame : record.frameText;
      const finalLens = record.lensText === 'Custom' ? record.customLens : record.lensText;
      const finalCoating = record.coatingText === 'Custom' ? record.customCoating : record.coatingText;

      // 1. Save the record
      await addDoc(collection(db, 'records'), {
        customerId, 
        customerName: `${record.lastName}, ${record.firstName}`, 
        date: record.date,
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
        frame: { name: finalFrame },
        lensType: { name: finalLens },
        coating: { name: finalCoating },
        total: record.total,
        amountPaid: Number(record.deposit) || 0, 
        balance: record.balance,
        paymentStatus: record.paymentStatus, 
        paymentMethod: record.paymentMethod,
        optometrist: record.optometrist, 
        createdBy: currentUser?.email, 
        createdAt: new Date().toISOString(),
        receiptNo: generatedReceipt,
      });

      // 2. Update Customer Stats
      await updateDoc(doc(db, 'customers', customerId), {
        firstName: record.firstName, lastName: record.lastName, nickname: record.nickname,
        address: record.address, age: record.age, phone: record.phone, occupation: record.occupation,
        lastVisit: new Date().toISOString(), totalVisits: (customer.totalVisits || 0) + 1,
        latestBalance: record.balance || 0,
        latestPaymentMethod: record.paymentMethod || 'Cash',
        latestPaymentStatus: record.paymentStatus || 'pending'
      });

      // 3. Save the order for sales tracking
      await addDoc(collection(db, 'orders'), {
        receiptNo: generatedReceipt || '', 
        customerId: customerId || '', 
        customerName: `${record.lastName || ''}, ${record.firstName || ''}`,
        customerPhone: record.phone || '', 
        notes: record.additionalNotes || record.prescriptionNotes || '',
        totalAmount: record.total || 0, 
        amountPaid: Number(record.deposit) || 0, 
        balance: record.balance || 0,
        paymentStatus: record.paymentStatus || 'pending', 
        paymentMethod: record.paymentMethod || 'Cash', 
        orderDate: new Date().toISOString(),
        items: [
          { name: finalFrame || 'Frame', category: record.frameText || 'Frame', qty: 1, price: FRAME_TYPES[record.frameText] || 0 },
          { name: finalLens || 'Lens', category: 'Lens', qty: 1, price: 0 },
          { name: finalCoating || 'Coating', category: 'Coating', qty: 1, price: 0 },
        ],
      });

            // ✅ 4. Mark appointment as completed (Handles early walk-ins)
      // Create a list of possible IDs (email and reference ID)
      const possibleIds = [customerId, customer?.email].filter(Boolean); // ✅ filter(Boolean) removes undefined/null

      if (possibleIds.length > 0) {
        const apptQuery = query(
          collection(db, 'appointments'),
          where('customerId', 'in', possibleIds),
          where('status', 'in', ['Pending', 'Scheduled'])
        );
        
        const apptSnap = await getDocs(apptQuery);
        if (!apptSnap.empty) {
          const pendingAppts = [];
          apptSnap.forEach(doc => pendingAppts.push({ id: doc.id, ...doc.data() }));
          pendingAppts.sort((a, b) => a.date.localeCompare(b.date));
          
          await updateDoc(doc(db, 'appointments', pendingAppts[0].id), {
            status: 'Completed'
          });
        }
      }

      // 5. Prepare for Lab Modal
      setSavedRecordForLab({
        id: generatedReceipt,
        customerId,
        customerName: `${record.lastName}, ${record.firstName}`,
        date: record.date,
        frameCategory: finalFrame, 
        lensType: finalLens, 
        coating: finalCoating, 
        totalAmount: record.total, 
        newODsph: record.newODsph, newODcyl: record.newODcyl, newODaxis: record.newODaxis,
        newOSsph: record.newOSsph, newOScyl: record.newOScyl, newOSaxis: record.newOSaxis,
        newADD: record.newADD, newPd: record.newPd,
        balance: record.balance
      });
      
      setTimeout(() => setShowLabModal(true), 100);
      setSaving(false);

    } catch (err) {
      console.error(err); 
      setSaveError(err.message);
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-8">
  
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">VITUG-SUMAYA</h1>
          <h2 className="text-xl font-bold">OPTICAL CLINIC</h2>
          <p className="text-sm text-gray-500 mt-1">PATIENT'S RECORD</p>
        </div>

        {/* Basic Info */}
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
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium">DATE:</span>
            <input 
              type="date" 
              value={record.date} 
              readOnly 
              disabled 
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-gray-50 text-gray-600 cursor-not-allowed" 
            />
          </div>
        </div>

                {/* OLD PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-4 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px] bg-gray-50 border-b-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">PD</div>
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">OLD PRESCRIPTION</div>
            <div className="p-2 text-center font-semibold text-xs">ADD</div>
          </div>
          <div className="grid grid-cols-[80px_1fr_90px]">
            <div className="border-r-2 border-gray-700 row-span-2 flex items-center justify-center p-2">
              {/* ✅ Changed to tel */}
              <input type="tel" inputMode="decimal" value={record.oldPd} onChange={(e) => setRecord({ ...record, oldPd: e.target.value })} className="w-full text-center text-sm outline-none bg-transparent" placeholder="PD" />
            </div>
            <div className="border-r-2 border-b-2 border-gray-700 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OD:</span>
                {/* ✅ Changed to tel */}
                <input type="tel" inputMode="decimal" value={record.oldODsph} onChange={(e) => setRecord({ ...record, oldODsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" />
                <input type="tel" inputMode="decimal" value={record.oldODcyl} onChange={(e) => setRecord({ ...record, oldODcyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" />
                <span className="text-xs">x</span>
                <input type="tel" inputMode="numeric" value={record.oldODaxis} onChange={(e) => setRecord({ ...record, oldODaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" />
              </div>
            </div>
            <div className="row-span-2 flex items-center justify-center p-2">
              <input type="tel" inputMode="decimal" value={record.oldADD} onChange={(e) => setRecord({ ...record, oldADD: e.target.value })} className="w-full text-center text-sm outline-none bg-transparent" placeholder="ADD" />
            </div>
            <div className="border-r-2 border-gray-700 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OS:</span>
                <input type="tel" inputMode="decimal" value={record.oldOSsph} onChange={(e) => setRecord({ ...record, oldOSsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" />
                <input type="tel" inputMode="decimal" value={record.oldOScyl} onChange={(e) => setRecord({ ...record, oldOScyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" />
                <span className="text-xs">x</span>
                <input type="tel" inputMode="numeric" value={record.oldOSaxis} onChange={(e) => setRecord({ ...record, oldOSaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" />
              </div>
            </div>
          </div>
        </div>

        {/* NEW PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px] bg-gray-50 border-b-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">PD</div>
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-xs">NEW PRESCRIPTION</div>
            <div className="p-2 text-center font-semibold text-xs">ADD</div>
          </div>
          <div className="grid grid-cols-[80px_1fr_90px]">
            <div className="border-r-2 border-gray-700 row-span-2 flex items-center justify-center p-2">
              <input type="tel" inputMode="decimal" value={record.newPd} onChange={(e) => setRecord({ ...record, newPd: e.target.value })} className="w-full text-center text-sm outline-none bg-transparent" placeholder="PD" />
            </div>
            <div className="border-r-2 border-b-2 border-gray-700 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OD:</span>
                <input type="tel" inputMode="decimal" value={record.newODsph} onChange={(e) => setRecord({ ...record, newODsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" />
                <input type="tel" inputMode="decimal" value={record.newODcyl} onChange={(e) => setRecord({ ...record, newODcyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" />
                <span className="text-xs">x</span>
                <input type="tel" inputMode="numeric" value={record.newODaxis} onChange={(e) => setRecord({ ...record, newODaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" />
              </div>
            </div>
            <div className="row-span-2 flex items-center justify-center p-2">
              <input type="tel" inputMode="decimal" value={record.newADD} onChange={(e) => setRecord({ ...record, newADD: e.target.value })} className="w-full text-center text-sm outline-none bg-transparent" placeholder="ADD" />
            </div>
            <div className="border-r-2 border-gray-700 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OS:</span>
                <input type="tel" inputMode="decimal" value={record.newOSsph} onChange={(e) => setRecord({ ...record, newOSsph: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="SPH" />
                <input type="tel" inputMode="decimal" value={record.newOScyl} onChange={(e) => setRecord({ ...record, newOScyl: e.target.value })} className="flex-1 border-b border-gray-400 text-sm outline-none" placeholder="CYL" />
                <span className="text-xs">x</span>
                <input type="tel" inputMode="numeric" value={record.newOSaxis} onChange={(e) => setRecord({ ...record, newOSaxis: e.target.value })} className="w-14 border-b border-gray-400 text-sm outline-none" placeholder="Axis" />
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="mb-6 space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prescription Notes / Remarks</label><textarea value={record.prescriptionNotes} onChange={(e) => setRecord({ ...record, prescriptionNotes: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" rows="2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label><input type="text" value={record.additionalNotes} onChange={(e) => setRecord({ ...record, additionalNotes: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" /></div>
        </div>

        {/* ✅ FRAME, LENS, COATING SECTION */}
        <div className="space-y-4 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#1e40af] w-24">FRAME TYPE:</span>
            <select 
              value={record.frameText} 
              onChange={(e) => {
                const isCustom = e.target.value === 'Custom';
                setRecord({ ...record, frameText: e.target.value, isManualTotal: isCustom });
              }}
              className="flex-1 border-b-2 border-blue-400 pb-1 text-sm outline-none bg-transparent font-bold text-[#1e40af]"
            >
              <option value="">-- Select Frame Type --</option>
              <option value="Plastic">Plastic (₱900 Base)</option>
              <option value="Metal">Metal (₱1,500 Base)</option>
              <option value="Branded">Branded (₱2,500 Base)</option>
              <option value="Own Frame">Customer's Own Frame (₱0)</option>
              <option value="Custom">Custom / Promo</option>
            </select>
          </div>
          {record.frameText === 'Custom' && (
            <div className="flex items-center gap-3 ml-24">
              <input type="text" placeholder="Type custom frame here..." value={record.customFrame} onChange={(e) => setRecord({ ...record, customFrame: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 w-24">LENS:</span>
            <select 
              value={record.lensText} 
              onChange={(e) => setRecord({ ...record, lensText: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent focus:border-[#4A90E2] font-medium"
            >
              <option value="">-- Select Lens --</option>
              {LENS_TYPES.map(lens => (
                <option key={lens} value={lens}>{lens}</option>
              ))}
            </select>
          </div>
          {record.lensText === 'Custom' && (
            <div className="flex items-center gap-3 ml-24">
              <input type="text" placeholder="Type custom lens here..." value={record.customLens} onChange={(e) => setRecord({ ...record, customLens: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 w-24">COATING:</span>
            <select 
              value={record.coatingText} 
              onChange={(e) => setRecord({ ...record, coatingText: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent focus:border-[#4A90E2] font-medium"
            >
              <option value="">-- Select Coating --</option>
              {COATING_TYPES.map(coat => (
                <option key={coat} value={coat}>{coat}</option>
              ))}
            </select>
          </div>
          {record.coatingText === 'Custom' && (
            <div className="flex items-center gap-3 ml-24">
              <input type="text" placeholder="Type custom coating here..." value={record.customCoating} onChange={(e) => setRecord({ ...record, customCoating: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]" />
            </div>
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
              min="0"
              value={record.total}
              onChange={(e) => {
                setRecord({ ...record, total: Number(e.target.value), isManualTotal: true });
              }}
              className="w-full text-lg font-bold outline-none bg-transparent border-b border-gray-300 focus:border-[#4A90E2]"
              />
               </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-20 text-gray-600">DEPOSIT:</span>
            <input 
            type="number" 
            min="0"
            value={record.deposit} 
            onChange={(e) => 
            setRecord({ ...record, deposit: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent" placeholder="0" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-20 text-gray-600">BALANCE:</span>
            <span className="flex-1 text-sm font-semibold text-red-600">₱{(record.balance || 0).toLocaleString()}</span>
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
              <div className="flex-1 flex">
                {record.paymentStatus === 'paid' ? (
                  <span className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-bold flex-1 text-center">
                    Fully Paid
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm font-bold flex-1 text-center">
                    Pending
                  </span>
                )}
              </div>
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
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save & Send to Lab'}</button>
        </div>
      </div>

      {/* MODALS */}
      <ConfirmModal
        isOpen={showPrescriptionError}
        title="Missing Prescription"
        message="Please enter at least the new prescription SPH for OD or OS."
        iconType="warning"
        confirmText="OK"
        confirmColor="red"
        isAlert
        onConfirm={() => setShowPrescriptionError(false)}
      />

      <ConfirmModal
        isOpen={showSelectionError}
        title="Incomplete Selection"
        message="Please make sure you have selected a Lens and a Coating (and filled in the custom text if 'Custom' is selected)."
        iconType="warning"
        confirmText="OK"
        confirmColor="red"
        isAlert
        onConfirm={() => setShowSelectionError(false)}
      />

      <ConfirmModal
        isOpen={!!saveError}
        title="Save Failed"
        message={saveError}
        iconType="error"
        confirmText="OK"
        confirmColor="red"
        isAlert
        onConfirm={() => setSaveError('')}
      />

      {/* ✅ The Lab Modal - onClose stays on page */}
      {showLabModal && savedRecordForLab && (
        <LabOrderModal 
          record={savedRecordForLab}
          onClose={() => {
            setShowLabModal(false);
            // Stay on page if they cancel
          }}
          onSuccess={() => {
            setShowLabModal(false);
            navigate('/admin/lab-orders'); // Navigate only on success
          }}
        />
      )}
    </div>
  );
}

export default PatientRecordPage;