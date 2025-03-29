 frontend/src/pages/Prescriptions.jsx
// ------------------------------------
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [form, setForm] = useState({
    medication_id: '',
    user_id: '',
    date_prescribed: '',
    date_filled: '',
    refills_remaining: '',
    expiration_date: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = () => {
    axios.get('http://localhost:8000/prescriptions')
      .then(res => setPrescriptions(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      medication_id: parseInt(form.medication_id),
      user_id: parseInt(form.user_id),
      refills_remaining: parseInt(form.refills_remaining) || 0
    };
    axios.post('http://localhost:8000/prescriptions', payload)
      .then(() => {
        fetchPrescriptions();
        setForm({ medication_id: '', user_id: '', date_prescribed: '', date_filled: '', refills_remaining: '', expiration_date: '', status: 'active', notes: '' });
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Prescriptions</h2>
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input name="medication_id" value={form.medication_id} onChange={handleChange} placeholder="Medication ID" type="number" className="block w-full p-2 border rounded" required />
        <input name="user_id" value={form.user_id} onChange={handleChange} placeholder="User ID" type="number" className="block w-full p-2 border rounded" required />
        <input name="date_prescribed" value={form.date_prescribed} onChange={handleChange} placeholder="Date Prescribed (YYYY-MM-DD)" className="block w-full p-2 border rounded" />
        <input name="date_filled" value={form.date_filled} onChange={handleChange} placeholder="Date Filled (YYYY-MM-DD)" className="block w-full p-2 border rounded" />
        <input name="refills_remaining" value={form.refills_remaining} onChange={handleChange} placeholder="Refills Remaining" type="number" className="block w-full p-2 border rounded" />
        <input name="expiration_date" value={form.expiration_date} onChange={handleChange} placeholder="Expiration Date (YYYY-MM-DD)" className="block w-full p-2 border rounded" />
        <input name="status" value={form.status} onChange={handleChange} placeholder="Status (active, expired, etc.)" className="block w-full p-2 border rounded" />
        <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Prescription</button>
      </form>

      <ul className="list-disc pl-5">
        {prescriptions.map(rx => (
          <li key={rx.id}>
            Medication ID: {rx.medication_id} – User ID: {rx.user_id} – Status: {rx.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Prescriptions;