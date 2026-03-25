// frontend/src/pages/Consumables.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

const EMPTY = { name: '', category: '', quantity: '', reorder_threshold: '', storage_location: '', notes: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (form.quantity === '' || form.quantity === null) {
    errors.quantity = 'Quantity is required';
  } else if (parseInt(form.quantity) < 0) {
    errors.quantity = 'Quantity must be 0 or more';
  }
  if (form.reorder_threshold !== '' && parseInt(form.reorder_threshold) < 0) {
    errors.reorder_threshold = 'Must be 0 or more';
  }
  return errors;
}

function isLowStock(item) {
  return item.reorder_threshold > 0 && item.quantity <= item.reorder_threshold;
}

function ConsumableForm({ form, onChange, errors, submitLabel, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div>
        <input name="name" value={form.name} onChange={onChange} placeholder="Name *"
          className={`block w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <input name="category" value={form.category} onChange={onChange} placeholder="Category" className="block w-full p-2 border rounded" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input type="number" min="0" name="quantity" value={form.quantity} onChange={onChange} placeholder="Quantity *"
            className={`block w-full p-2 border rounded ${errors.quantity ? 'border-red-500' : ''}`} />
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
        </div>
        <div>
          <input type="number" min="0" name="reorder_threshold" value={form.reorder_threshold} onChange={onChange} placeholder="Reorder at"
            className={`block w-full p-2 border rounded ${errors.reorder_threshold ? 'border-red-500' : ''}`} />
          {errors.reorder_threshold && <p className="text-red-500 text-sm mt-1">{errors.reorder_threshold}</p>}
        </div>
      </div>
      <input name="storage_location" value={form.storage_location} onChange={onChange} placeholder="Storage Location" className="block w-full p-2 border rounded" />
      <input name="notes" value={form.notes} onChange={onChange} placeholder="Notes" className="block w-full p-2 border rounded" />
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{submitLabel}</button>
      </div>
    </form>
  );
}

function Consumables() {
  const [consumables, setConsumables] = useState([]);
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

  const fetchConsumables = useCallback((term = '') => {
    const q = term ? `?search=${encodeURIComponent(term)}` : '';
    axios.get(`/api/consumables${q}`)
      .then(res => setConsumables(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchConsumables(); }, [fetchConsumables]);

  useEffect(() => {
    const t = setTimeout(() => fetchConsumables(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchConsumables]);

  const toPayload = (form) => ({
    ...form,
    quantity: parseInt(form.quantity) || 0,
    reorder_threshold: form.reorder_threshold !== '' ? parseInt(form.reorder_threshold) : 0,
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errors = validate(addForm);
    if (Object.keys(errors).length) { setAddErrors(errors); return; }
    setAddErrors({});
    axios.post('/api/consumables', toPayload(addForm))
      .then(() => { fetchConsumables(search); setAddForm(EMPTY); showFlash('Consumable added'); })
      .catch(console.error);
  };

  const openEdit = (item) => {
    setEditForm({
      name: item.name,
      category: item.category || '',
      quantity: String(item.quantity ?? ''),
      reorder_threshold: String(item.reorder_threshold ?? ''),
      storage_location: item.storage_location || '',
      notes: item.notes || '',
    });
    setEditErrors({});
    setEditId(item.id);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validate(editForm);
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setEditErrors({});
    axios.put(`/api/consumables/${editId}`, toPayload(editForm))
      .then(() => { fetchConsumables(search); setEditId(null); showFlash('Consumable updated'); })
      .catch(console.error);
  };

  const confirmDelete = () => {
    axios.delete(`/api/consumables/${deleteTarget.id}`)
      .then(() => { fetchConsumables(search); setDeleteTarget(null); showFlash('Consumable deleted'); })
      .catch(console.error);
  };

  const categories = [...new Set(consumables.map(c => c.category).filter(Boolean))].sort();
  const displayed = categoryFilter ? consumables.filter(c => c.category === categoryFilter) : consumables;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Consumables</h2>
      {flash && <div className="text-green-600 font-semibold mb-3">{flash}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-medium mb-3">Add Consumable</h3>
        <ConsumableForm
          form={addForm} onChange={e => setAddForm({ ...addForm, [e.target.name]: e.target.value })}
          errors={addErrors} submitLabel="Add Consumable" onSubmit={handleAddSubmit}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="flex-1 p-2 border rounded"
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {displayed.length === 0
        ? <p className="text-gray-400 text-sm">No consumables found.</p>
        : (
          <ul className="space-y-2">
            {displayed.map(item => {
              const low = isLowStock(item);
              return (
                <li key={item.id} className={`flex items-center justify-between p-3 rounded shadow-sm ${low ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'}`}>
                  <span>
                    <span className="font-medium">{item.name}</span>
                    <span className={`text-sm ml-2 ${low ? 'text-yellow-700 font-semibold' : 'text-gray-500'}`}>
                      Qty: {item.quantity}
                      {item.reorder_threshold > 0 && ` / reorder at ${item.reorder_threshold}`}
                    </span>
                    {item.category && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>}
                    {item.storage_location && <span className="text-gray-400 text-sm ml-2">({item.storage_location})</span>}
                    {low && <span className="ml-2 text-xs text-yellow-700 font-semibold">Low stock</span>}
                  </span>
                  <div className="flex gap-3 shrink-0 ml-2 text-sm">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(item)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      }

      <Modal isOpen={editId !== null} onClose={() => setEditId(null)} title="Edit Consumable">
        <ConsumableForm
          form={editForm} onChange={e => setEditForm({ ...editForm, [e.target.name]: e.target.value })}
          errors={editErrors} submitLabel="Save" onSubmit={handleEditSubmit} onCancel={() => setEditId(null)}
        />
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Consumable">
        <p className="mb-5">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

export default Consumables;
