// frontend/src/pages/Consumables.jsx
// ----------------------------------
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Consumables() {
  const [consumables, setConsumables] = useState([]);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: '',
    reorder_threshold: '',
    storage_location: '',
    notes: ''
  });

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = () => {
    axios.get('http://localhost:8085/consumables')
      .then(res => setConsumables(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, quantity: parseInt(form.quantity), reorder_threshold: parseInt(form.reorder_threshold) };
    axios.post('http://localhost:8085/consumables', payload)
      .then(() => {
        fetchConsumables();
        setForm({ name: '', category: '', quantity: '', reorder_threshold: '', storage_location: '', notes: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Consumables</h2>
      {success && <div className="text-green-600 font-semibold">Consumable added successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="block w-full p-2 border rounded" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="block w-full p-2 border rounded" />
        <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" type="number" className="block w-full p-2 border rounded" required />
        <input name="reorder_threshold" value={form.reorder_threshold} onChange={handleChange} placeholder="Reorder Threshold" type="number" className="block w-full p-2 border rounded" />
        <input name="storage_location" value={form.storage_location} onChange={handleChange} placeholder="Storage Location" className="block w-full p-2 border rounded" />
        <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Consumable</button>
      </form>

      <ul className="list-disc pl-5">
        {consumables.map(item => (
          <li key={item.id}>
            {item.name} – Quantity: {item.quantity} {item.storage_location && `(${item.storage_location})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Consumables;
