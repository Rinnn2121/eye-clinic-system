import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, addDoc, collection, getDocs
} from 'firebase/firestore';
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
    pd: '',
    oldOD: '', oldOS: '', oldADD: '',
    newOD: '', newOS: '', newADD: '',
    frame: '', lens: '',
    total: 0,
    deposit: '',
    balance: 0,
    optometrist: '',
  });

  // ✅ Load customer + inventory
  useEffect(() => {
    const loadData = async () => {
      try {
        const custSnap = await getDoc(doc(db, 'customers', customerId));
        if (custSnap.exists()) {
          setCustomer({ id: custSnap.id, ...custSnap.data() });
        } else {
          alert('Customer not found');
          navigate('/admin/customers');
          return;
        }

        const invSnap = await getDocs(collection(db, 'inventory'));
        const invList = [];
        invSnap.forEach((d) => invList.push({ id: d.id, ...d.data() }));
        setInventory(invList);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadData();
  }, [customerId, navigate]);

  // ✅ Auto-calculate total & balance
  useEffect(() => {
    const frameItem = inventory.find((i) => i.id === record.frame);
    const lensItem = inventory.find((i) => i.id === record.lens);
    const total = (frameItem?.price || 0) + (lensItem?.price || 0);
    const balance = total - (Number(record.deposit) || 0);
    setRecord((prev) => ({ ...prev, total, balance: balance > 0 ? balance : 0 }));
  }, [record.frame, record.lens, record.deposit, inventory]);

  // ✅ Save record
  const handleSave = async () => {
    if (!record.newOD && !record.newOS) {
      alert('Please enter at least the new prescription OD or OS.');
      return;
    }

    setSaving(true);
    try {
      const frameItem = inventory.find((i) => i.id === record.frame);
      const lensItem = inventory.find((i) => i.id === record.lens);
      const receiptNo = `SO-${Date.now().toString().slice(-5)}`;

      await addDoc(collection(db, 'records'), {
        customerId,
        customerName: `${customer.lastName}, ${customer.firstName}`,
        date: record.date,
        pd: Number(record.pd) || 0,
        oldPrescription: { od: record.oldOD, os: record.oldOS, add: record.oldADD },
        newPrescription: { od: record.newOD, os: record.newOS, add: record.newADD },
        frame: frameItem ? { id: frameItem.id, name: frameItem.name, price: frameItem.price } : null,
        lens: lensItem ? { id: lensItem.id, name: lensItem.name, price: lensItem.price } : null,
        total: record.total,
        deposit: Number(record.deposit) || 0,
        balance: record.balance,
        optometrist: record.optometrist,
        createdBy: currentUser?.email,
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'orders'), {
        receiptNo,
        customerId,
        customerName: `${customer.lastName}, ${customer.firstName}`,
        totalAmount: record.total,
        paymentMethod: 'Cash',
        orderDate: new Date().toISOString(),
        items: [
          ...(frameItem ? [{ name: frameItem.name, category: 'Frames', qty: 1, price: frameItem.price }] : []),
          ...(lensItem ? [{ name: lensItem.name, category: 'Lenses', qty: 1, price: lensItem.price }] : []),
        ],
      });

      await updateDoc(doc(db, 'customers', customerId), {
        lastVisit: new Date().toISOString(),
        totalVisits: (customer.totalVisits || 0) + 1,
      });

      alert(`✅ Record saved!\nReceipt: ${receiptNo}`);
      navigate('/admin/customers');
    } catch (err) {
      console.error(err);
      alert('Failed to save: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">


        {/* NAME ROW */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <input
              type="text"
              value={customer?.lastName || ''}
              readOnly
              className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none"
            />
            <p className="text-xs text-center font-bold text-gray-600 mt-1">Last name</p>
          </div>
          <div>
            <input
              type="text"
              value={customer?.firstName || ''}
              readOnly
              className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none"
            />
            <p className="text-xs text-center font-bold text-gray-600 mt-1">First name</p>
          </div>
          <div>
            <input
              type="text"
              value={customer?.nickname || ''}
              readOnly
              className="w-full border-b-2 border-gray-400 pb-1 text-sm outline-none"
            />
            <p className="text-xs text-center font-bold text-gray-600 mt-1">Nickname</p>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="mb-3">
          <div className="flex items-end gap-2">
            <span className="text-sm  font-medium">Address:</span>
            <input
              type="text"
              value={customer?.address || ''}
              readOnly
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
            />
          </div>
        </div>

        {/* AGE / CONTACT / OCCUPATION / DATE */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium">Age:</span>
            <input
              type="text"
              value={customer?.age || ''}
              readOnly
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium">Contact No.:</span>
            <input
              type="text"
              value={customer?.phone || ''}
              readOnly
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium">Occupation:</span>
            <input
              type="text"
              value={customer?.occupation || ''}
              readOnly
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium">Date:</span>
            <input
              type="date"
              value={record.date}
              onChange={(e) => setRecord({ ...record, date: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
            />
          </div>
        </div>

        {/* OLD PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-4 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_100px]">
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-sm">PD</div>
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-sm">
              Old Prescription
            </div>
            <div className="p-2 text-center font-semibold text-sm">ADD</div>
          </div>
          <div className="grid grid-cols-[80px_1fr_100px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2">
              <input
                type="number"
                value={record.pd}
                onChange={(e) => setRecord({ ...record, pd: e.target.value })}
                className="w-full text-center text-sm outline-none"
              />
            </div>
            <div className="border-r-2 border-gray-700 p-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OD:</span>
                <input
                  type="text"
                  value={record.oldOD}
                  onChange={(e) => setRecord({ ...record, oldOD: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-0.5 text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OS:</span>
                <input
                  type="text"
                  value={record.oldOS}
                  onChange={(e) => setRecord({ ...record, oldOS: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-0.5 text-sm outline-none"
                />
              </div>
            </div>
            <div className="p-2 flex items-center justify-center">
              <input
                type="text"
                value={record.oldADD}
                onChange={(e) => setRecord({ ...record, oldADD: e.target.value })}
                className="w-full text-center text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* NEW PRESCRIPTION TABLE */}
        <div className="border-2 border-gray-700 rounded-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_100px]">
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-sm">PD</div>
            <div className="border-r-2 border-gray-700 p-2 text-center font-semibold text-sm">
              New Prescription
            </div>
            <div className="p-2 text-center font-semibold text-sm">ADD</div>
          </div>
          <div className="grid grid-cols-[80px_1fr_100px] border-t-2 border-gray-700">
            <div className="border-r-2 border-gray-700 p-2">
              <input
                type="number"
                value={record.pd}
                onChange={(e) => setRecord({ ...record, pd: e.target.value })}
                className="w-full text-center text-sm outline-none"
              />
            </div>
            <div className="border-r-2 border-gray-700 p-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OD:</span>
                <input
                  type="text"
                  value={record.newOD}
                  onChange={(e) => setRecord({ ...record, newOD: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-0.5 text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium w-8">OS:</span>
                <input
                  type="text"
                  value={record.newOS}
                  onChange={(e) => setRecord({ ...record, newOS: e.target.value })}
                  className="flex-1 border-b border-gray-400 pb-0.5 text-sm outline-none"
                />
              </div>
            </div>
            <div className="p-2 flex items-center justify-center">
              <input
                type="text"
                value={record.newADD}
                onChange={(e) => setRecord({ ...record, newADD: e.target.value })}
                className="w-full text-center text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* FRAME / LENS */}
        <div className="space-y-3 mb-6">
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium w-20">Frame:</span>
            <select
              value={record.frame}
              onChange={(e) => setRecord({ ...record, frame: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent"
            >
              <option value="">Select frame</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-sm font-medium w-20">Lens:</span>
            <select
              value={record.lens}
              onChange={(e) => setRecord({ ...record, lens: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none bg-transparent"
            >
              <option value="">Select lens</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.name} — ₱{i.price}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TOTALS */}
        <div className="space-y-3 mb-6">
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium w-20">Total:</span>
            <span className="flex-1 border-b border-gray-400 pb-1 text-sm">
              ₱{record.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium w-20">Deposit:</span>
            <input
              type="number"
              value={record.deposit}
              onChange={(e) => setRecord({ ...record, deposit: e.target.value })}
              className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-sm font-medium w-20">Balance:</span>
            <span className="flex-1 border-b border-gray-400 pb-1 text-sm font-semibold text-red-600">
              ₱{record.balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* OPTOMETRIST */}
        <div className="flex items-end gap-2 mb-8">
          <span className="text-sm font-medium">Optometrist:</span>
          <input
            type="text"
            value={record.optometrist}
            onChange={(e) => setRecord({ ...record, optometrist: e.target.value })}
            className="flex-1 border-b border-gray-400 pb-1 text-sm outline-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#4A90E2] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4A90E2]/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Print'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default PatientRecordPage;