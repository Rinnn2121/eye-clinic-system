import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

function PatientRecordPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [record, setRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    
    firstName: '', lastName: '', nickname: '', address: '', age: '', phone: '', occupation: '',
    oldPd: '', newPd: '',
    oldODsph: '', oldODcyl: '', oldODaxis: '',
    oldOSsph: '', oldOScyl: '', oldOSaxis: '', oldADD: '',
    newODsph: '', newODcyl: '', newODaxis: '',
    newOSsph: '', newOScyl: '', newOSaxis: '', newADD: '',
    prescriptionNotes: '', additionalNotes: '',
    frame: '', lens: '',
    total: 0, amountPaid: '', balance: 0,
    paymentStatus: 'pending', paymentMethod: 'Cash',
    optometrist: '',
  });

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
          alert('Customer not found'); navigate('/admin/customers'); return;
        }

        const invSnap = await getDocs(collection(db, 'inventory'));
        const invList = [];
        invSnap.forEach((d) => invList.push({ id: d.id, ...d.data() }));
        setInventory(invList);
        setLoading(false);
      } catch (err) {
        console.error(err); setLoading(false);
      }
    };
    load();
  }, [customerId, navigate]);

  // Auto-calculate total
  useEffect(() => {
    const f = inventory.find((i) => i.id === record.frame);
    const l = inventory.find((i) => i.id === record.lens);
    
    // If the frame has "Package" in the name, use its price. Otherwise, add frame + lens.
    const isPackage = f?.name?.toLowerCase().includes('package');
    const subtotal = isPackage ? (f?.price || 0) : ((f?.price || 0) + (l?.price || 0));
    
    const paid = Number(record.amountPaid) || 0;
    const balance = subtotal - paid;

    setRecord((p) => ({ 
      ...p, 
      total: subtotal, 
      balance: balance > 0 ? balance : 0 
    }));
  }, [record.frame, record.lens, record.amountPaid, inventory]);

  const handleSave = async () => {
    if (!record.newODsph && !record.newOSsph) {
      alert('Please enter at least the new prescription SPH for OD or OS.'); return;
    }

    setSaving(true);
    try {
      const f = inventory.find((i) => i.id === record.frame);
      const l = inventory.find((i) => i.id === record.lens);
      const receiptNo = `SO-${Date.now().toString().slice(-5)}`;
      const isPackage = f?.name?.toLowerCase().includes('package');

      await updateDoc(doc(db, 'customers', customerId), {
        firstName: record.firstName, lastName: record.lastName, nickname: record.nickname,
        address: record.address, age: record.age, phone: record.phone, occupation: record.occupation,
        lastVisit: new Date().toISOString(), totalVisits: (customer.totalVisits || 0) + 1,
      });

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
        lens: l ? { id: l.id, name: l.name, price: l.price } : null,
        total: record.total,
        amountPaid: Number(record.amountPaid) || 0, balance: record.balance,
        paymentStatus: record.paymentStatus, paymentMethod: record.paymentMethod,
        optometrist: record.optometrist, createdBy: currentUser?.email, createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'orders'), {
        receiptNo, customerId, customerName: `${record.lastName}, ${record.firstName}`,
        totalAmount: record.total, amountPaid: Number(record.amountPaid) || 0, balance: record.balance,
        paymentStatus: record.paymentStatus, paymentMethod: record.paymentMethod, orderDate: new Date().toISOString(),
        items: [
          ...(f ? [{ name: f.name, category: isPackage ? 'Package' : f.category, qty: 1, price: f.price }] : []),
          ...(!isPackage && l ? [{ name: l.name, category: 'Lens', qty: 1, price: l.price }] : []),
        ],
      });

      alert(`✅ Record saved! Receipt: ${receiptNo}`);
      navigate('/admin/customers');
    } catch (err) {
      console.error(err); alert('Failed to save: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div></div>;

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

        {/* FRAME & LENS */}
        <div className="space-y-3 mb-6">
          {inventory.find((i) => i.id === record.frame)?.name?.toLowerCase().includes('package') ? (
            <div className="flex items-end gap-2">
              <span className="text-sm font-medium w-20 text-[#4A90E2]">PACKAGE:</span>
              <select value={record.frame} onChange={(e) => setRecord({ ...record, frame: e.target.value })}
                className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent font-semibold text-[#4A90E2]">
                <option value="">Select Package</option>
                {inventory.filter((i) => i.name?.toLowerCase().includes('package')).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
                ))}
                <option value="custom">--- Custom Frame & Lens ---</option>
              </select>
              {record.frame && record.frame !== 'custom' && (
                <button onClick={() => setRecord({ ...record, frame: '', lens: '' })} className="text-xs text-red-500 hover:underline">Clear</button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <span className="text-sm font-medium w-20">FRAME:</span>
                <select value={record.frame} onChange={(e) => setRecord({ ...record, frame: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent">
                  <option value="">Select frame</option>
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
              <div className="flex items-end gap-2">
                <span className="text-sm font-medium w-20">LENS:</span>
                <select value={record.lens} onChange={(e) => setRecord({ ...record, lens: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent">
                  <option value="">Select lens</option>
                  {inventory.filter((i) => i.category === 'Lens').map((i) => (
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
            <span className="flex-1 text-lg font-bold">₱{record.total.toLocaleString()}</span>
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
              <select value={record.paymentStatus} onChange={(e) => setRecord({ ...record, paymentStatus: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90E2]">
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
    </div>
  );
}

export default PatientRecordPage;