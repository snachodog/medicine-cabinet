// frontend/src/pages/Medications.jsx
// TODO: Add barcode scanning support to pre-fill the medication name and dosage fields.
// Use a library like html5-qrcode or quagga2 to scan via the device camera.
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

const EMPTY = { name: '', brand_name: '', form: '', dosage: '', instructions: '', category: '', notes: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  return errors;
}

function MedicationForm({ form, onChange, errors, submitLabel, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div>
        <input
          name="name" value={form.name} onChange={onChange} placeholder="Name *"
          className={`block w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <input name="brand_name" value={form.brand_name} onChange={onChange} placeholder="Brand Name" className="block w-full p-2 border rounded" />
      <input name="form" value={form.form} onChange={onChange} placeholder="Form (tablet, liquid…)" className="block w-full p-2 border rounded" />
      <input name="dosage" value={form.dosage} onChange={onChange} placeholder="Dosage (500mg…)" className="block w-full p-2 border rounded" />
      <input name="instructions" value={form.instructions} onChange={onChange} placeholder="Instructions" className="block w-full p-2 border rounded" />
      <input name="category" value={form.category} onChange={onChange} placeholder="Category" className="block w-full p-2 border rounded" />
      <input name="notes" value={form.notes} onChange={onChange} placeholder="Notes" className="block w-full p-2 border rounded" />
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{submitLabel}</button>
      </div>
    </form>
  );
}

function Medications() {
  const [medications, setMedications] = useState([]);
  const [addForm, setAddForm] = useState(EMPTY);
  const [addErrors, setAddErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [editErrors, setEditErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [flash, setFlash] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const fetchMedications = useCallback((term = '') => {
    const q = term ? `?search=${encodeURIComponent(term)}` : '';
    axios.get(`/api/medications${q}`)
      .then(res => setMedications(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchMedications(); }, [fetchMedications]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchMedications(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchMedications]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errors = validate(addForm);
    if (Object.keys(errors).length) { setAddErrors(errors); return; }
    setAddErrors({});
    axios.post('/api/medications', addForm)
      .then(() => { fetchMedications(search); setAddForm(EMPTY); showFlash('Medication added'); })
      .catch(console.error);
  };

  const openEdit = (med) => {
    setEditForm({ name: med.name, brand_name: med.brand_name || '', form: med.form || '', dosage: med.dosage || '', instructions: med.instructions || '', category: med.category || '', notes: med.notes || '' });
    setEditErrors({});
    setEditId(med.id);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validate(editForm);
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setEditErrors({});
    axios.put(`/api/medications/${editId}`, editForm)
      .then(() => { fetchMedications(search); setEditId(null); showFlash('Medication updated'); })
      .catch(console.error);
  };

  const confirmDelete = () => {
    axios.delete(`/api/medications/${deleteTarget.id}`)
      .then(() => { fetchMedications(search); setDeleteTarget(null); showFlash('Medication deleted'); })
      .catch(console.error);
  };

  const categories = [...new Set(medications.map(m => m.category).filter(Boolean))].sort();
  const displayed = categoryFilter ? medications.filter(m => m.category === categoryFilter) : medications;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Medications</h2>
      {flash && <div className="text-green-600 font-semibold mb-3">{flash}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-medium mb-3">Add Medication</h3>
        <MedicationForm
          form={addForm} onChange={e => setAddForm({ ...addForm, [e.target.name]: e.target.value })}
          errors={addErrors} submitLabel="Add Medication" onSubmit={handleAddSubmit}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, brand, or category…"
          className="flex-1 p-2 border rounded"
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {displayed.length === 0
        ? <p className="text-gray-400 text-sm">No medications found.</p>
        : (
          <ul className="space-y-2">
            {displayed.map(med => (
              <li key={med.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                <span>
                  <span className="font-medium">{med.name}</span>
                  {med.dosage && <span className="text-gray-500 text-sm ml-2">{med.dosage}</span>}
                  {med.form && <span className="text-gray-400 text-sm ml-1">({med.form})</span>}
                  {med.category && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{med.category}</span>}
                </span>
                <div className="flex gap-3 shrink-0 ml-2 text-sm">
                  <button onClick={() => openEdit(med)} className="text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => setDeleteTarget(med)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )
      }

      <Modal isOpen={editId !== null} onClose={() => setEditId(null)} title="Edit Medication">
        <MedicationForm
          form={editForm} onChange={e => setEditForm({ ...editForm, [e.target.name]: e.target.value })}
          errors={editErrors} submitLabel="Save" onSubmit={handleEditSubmit} onCancel={() => setEditId(null)}
        />
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Medication">
        <p className="mb-5">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

export default Medications;
