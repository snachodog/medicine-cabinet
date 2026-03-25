// frontend/src/pages/Medications.jsx
// ----------------------------------
// TODO: Add inline edit and delete controls to each medication list item. Clicking edit
// should populate the form fields with the existing record. Clicking delete should show
// a confirmation dialog before calling DELETE /api/medications/:id.
// TODO: Add a search bar and category filter above the medication list. Filter results
// client-side on name, brand_name, and category. Add a backend GET /medications?search=
// query parameter for server-side search as a follow-up.
// TODO: Add client-side form validation. Name is required. Show inline error messages
// under each invalid field rather than relying on the browser's default required behavior.
// TODO: Add barcode scanning support to pre-fill the medication name and dosage fields.
// Use a library like html5-qrcode or quagga2 to scan via the device camera.
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Medications() {
  const [medications, setMedications] = useState([]);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand_name: '',
    form: '',
    dosage: '',
    instructions: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = () => {
    axios.get('/api/medications')
      .then(res => setMedications(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/medications', form)
      .then(() => {
        fetchMedications();
        setForm({ name: '', brand_name: '', form: '', dosage: '', instructions: '', category: '', notes: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Medications</h2>
      {success && <div className="text-green-600 font-semibold">Medication added successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="block w-full p-2 border rounded" required />
        <input name="brand_name" value={form.brand_name} onChange={handleChange} placeholder="Brand Name" className="block w-full p-2 border rounded" />
        <input name="form" value={form.form} onChange={handleChange} placeholder="Form (e.g. tablet, liquid)" className="block w-full p-2 border rounded" />
        <input name="dosage" value={form.dosage} onChange={handleChange} placeholder="Dosage (e.g. 500mg)" className="block w-full p-2 border rounded" />
        <input name="instructions" value={form.instructions} onChange={handleChange} placeholder="Instructions" className="block w-full p-2 border rounded" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="block w-full p-2 border rounded" />
        <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Medication</button>
      </form>

      <ul className="list-disc pl-5">
        {medications.map(med => (
          <li key={med.id}>
            {med.name} – {med.dosage} {med.form && `(${med.form})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Medications;
