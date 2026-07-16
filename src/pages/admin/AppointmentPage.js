import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    date: '',
    time: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'appointments'));
      const items = [];
      querySnapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setAppointments(items);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), newAppointment);
      setNewAppointment({ customerName: '', date: '', time: '', status: 'scheduled' });
      await loadAppointments();
      alert('✅ Appointment scheduled successfully!');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📅 Appointments</h1>
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Schedule Form */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Schedule Appointment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={newAppointment.customerName}
                  onChange={(e) => setNewAppointment({...newAppointment, customerName: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </form>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Appointments List ({appointments.length})</h2>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
              ) : (
                appointments.map((apt, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-xl">
                    <p className="font-semibold">{apt.customerName}</p>
                    <p className="text-sm text-gray-600">{apt.date} at {apt.time}</p>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                      apt.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentPage;