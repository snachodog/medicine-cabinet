// frontend/src/pages/Users.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

const EMPTY = { name: '', email: '', allergies: '', medical_conditions: '', emergency_contact: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (form.email && !EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email address';
  return errors;
}

function UserForm({ form, onChange, errors, submitLabel, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div>
        <input name="name" value={form.name} onChange={onChange} placeholder="Name *"
          className={`block w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div>
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" type="email"
          className={`block w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`} />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      <input name="allergies" value={form.allergies} onChange={onChange} placeholder="Allergies" className="block w-full p-2 border rounded" />
      <input name="medical_conditions" value={form.medical_conditions} onChange={onChange} placeholder="Medical Conditions" className="block w-full p-2 border rounded" />
      <input name="emergency_contact" value={form.emergency_contact} onChange={onChange} placeholder="Emergency Contact" className="block w-full p-2 border rounded" />
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{submitLabel}</button>
      </div>
    </form>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [addForm, setAddForm] = useState(EMPTY);
  const [addErrors, setAddErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [editErrors, setEditErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [flash, setFlash] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const fetchUsers = useCallback(() => {
    axios.get('/api/persons').then(r => setUsers(r.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errors = validate(addForm);
    if (Object.keys(errors).length) { setAddErrors(errors); return; }
    setAddErrors({});
    axios.post('/api/persons', addForm)
      .then(() => { fetchUsers(); setAddForm(EMPTY); showFlash('Person added'); })
      .catch(console.error);
  };

  const openEdit = (user) => {
    setEditForm({
      name: user.name,
      email: user.email || '',
      allergies: user.allergies || '',
      medical_conditions: user.medical_conditions || '',
      emergency_contact: user.emergency_contact || '',
    });
    setEditErrors({});
    setEditId(user.id);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validate(editForm);
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setEditErrors({});
    axios.put(`/api/persons/${editId}`, editForm)
      .then(() => { fetchUsers(); setEditId(null); showFlash('Person updated'); })
      .catch(console.error);
  };

  const confirmDelete = () => {
    axios.delete(`/api/persons/${deleteTarget.id}`)
      .then(() => { fetchUsers(); setDeleteTarget(null); showFlash('Person deleted'); })
      .catch(console.error);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">People</h2>
      {flash && <div className="text-green-600 font-semibold mb-3">{flash}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-medium mb-3">Add Person</h3>
        <UserForm
          form={addForm} onChange={e => setAddForm({ ...addForm, [e.target.name]: e.target.value })}
          errors={addErrors} submitLabel="Add Person" onSubmit={handleAddSubmit}
        />
      </div>

      {users.length === 0
        ? <p className="text-gray-400 text-sm">No people added yet.</p>
        : (
          <ul className="space-y-2">
            {users.map(user => (
              <li key={user.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                <span>
                  <span className="font-medium">{user.name}</span>
                  {user.email && <span className="text-gray-500 text-sm ml-2">{user.email}</span>}
                  {user.allergies && <span className="text-xs text-red-600 ml-2">Allergies: {user.allergies}</span>}
                </span>
                <div className="flex gap-3 shrink-0 ml-2 text-sm">
                  <button onClick={() => openEdit(user)} className="text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => setDeleteTarget(user)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )
      }

      <Modal isOpen={editId !== null} onClose={() => setEditId(null)} title="Edit Person">
        <UserForm
          form={editForm} onChange={e => setEditForm({ ...editForm, [e.target.name]: e.target.value })}
          errors={editErrors} submitLabel="Save" onSubmit={handleEditSubmit} onCancel={() => setEditId(null)}
        />
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Person">
        <p className="mb-5">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

export default Users;
