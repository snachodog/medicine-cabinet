// frontend/src/pages/Prescriptions.jsx
// ------------------------------------
// TODO: Add inline edit and delete controls to each prescription list item. Clicking
// edit should populate the form. Clicking delete should confirm before calling
// DELETE /api/prescriptions/:id.
// TODO: Highlight prescriptions expiring within 30 days in yellow and expired ones in
// red in the list view. Compare expiration_date to today's date client-side.
// TODO: Show medication name and user name in the list instead of raw IDs. The data
// is already fetched — join it by matching medication_id and user_id.
// TODO: Add client-side form validation. medication_id and user_id are required;
// date fields should reject invalid date strings before submission.
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [users, setUsers] = useState([]);
  const [success, setSuccess] = useState(false);
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
    fetchMedications();
    fetchUsers();
  }, []);

  const fetchPrescriptions = () => {
    axios.get('/api/prescriptions')
      .then(res => setPrescriptions(res.data))
      .catch(err => console.error(err));
  };

  const fetchMedications = () => {
    axios.get('/api/medications')
      .then(res => setMedications(res.data))
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    axios.get('/api/users')
      .then(res => setUsers(res.data))
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
    axios.post('/api/prescriptions', payload)
      .then(() => {
        fetchPrescriptions();
        setForm({ medication_id: '', user_id: '', date_prescribed: '', date_filled: '', refills_remaining: '', expiration_date: '', status: 'active', notes: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Prescriptions</h2>
      {success && <div className="text-green-600 font-semibold">Prescription added successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <select name="medication_id" value={form.medication_id} onChange={handleChange} className="block w-full p-2 border rounded" required>
          <option value="">Select Medication</option>
          {medications.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select name="user_id" value={form.user_id} onChange={handleChange} className="block w-full p-2 border rounded" required>
          <option value="">Select User</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
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