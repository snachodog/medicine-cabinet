// frontend/src/pages/Medications.jsx
// ----------------------------------
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
    axios.get('http://localhost:8000/medications')
      .then(res => setMedications(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/medications', form)
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
