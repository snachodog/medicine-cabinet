// frontend/src/pages/Prescriptions.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

const EMPTY = {
  medication_id: '', person_id: '', date_prescribed: '', date_filled: '',
  refills_remaining: '', expiration_date: '', status: 'active', notes: '',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(form) {
  const errors = {};
  if (!form.medication_id) errors.medication_id = 'Medication is required';
  if (!form.person_id) errors.person_id = 'Person is required';
  if (form.date_prescribed && !DATE_RE.test(form.date_prescribed)) errors.date_prescribed = 'Use YYYY-MM-DD format';
  if (form.date_filled && !DATE_RE.test(form.date_filled)) errors.date_filled = 'Use YYYY-MM-DD format';
  if (form.expiration_date && !DATE_RE.test(form.expiration_date)) errors.expiration_date = 'Use YYYY-MM-DD format';
  return errors;
}

function expirationClass(dateStr) {
  if (!dateStr) return '';
  const exp = new Date(dateStr);
  const now = new Date();
  if (exp < now) return 'text-red-600 font-semibold';
  if (exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'text-yellow-600 font-semibold';
  return '';
}

function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-600 mb-1">{label}</label>}
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function PrescriptionForm({ form, onChange, errors, medications, persons, submitLabel, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Medication *" error={errors.medication_id}>
        <select name="medication_id" value={form.medication_id} onChange={onChange}
          className={`block w-full p-2 border rounded ${errors.medication_id ? 'border-red-500' : ''}`}>
          <option value="">Select medication</option>
          {medications.map(m => <option key={m.id} value={m.id}>{m.name}{m.dosage ? ` — ${m.dosage}` : ''}</option>)}
        </select>
      </Field>
      <Field label="Person *" error={errors.person_id}>
        <select name="person_id" value={form.person_id} onChange={onChange}
          className={`block w-full p-2 border rounded ${errors.person_id ? 'border-red-500' : ''}`}>
          <option value="">Select person</option>
          {persons.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </Field>
      <Field label="Date Prescribed" error={errors.date_prescribed}>
        <input type="date" name="date_prescribed" value={form.date_prescribed} onChange={onChange}
          className={`block w-full p-2 border rounded ${errors.date_prescribed ? 'border-red-500' : ''}`} />
      </Field>
      <Field label="Date Filled" error={errors.date_filled}>
        <input type="date" name="date_filled" value={form.date_filled} onChange={onChange}
          className={`block w-full p-2 border rounded ${errors.date_filled ? 'border-red-500' : ''}`} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Refills Remaining">
          <input type="number" min="0" name="refills_remaining" value={form.refills_remaining} onChange={onChange}
            className="block w-full p-2 border rounded" />
        </Field>
        <Field label="Expiration Date" error={errors.expiration_date}>
          <input type="date" name="expiration_date" value={form.expiration_date} onChange={onChange}
            className={`block w-full p-2 border rounded ${errors.expiration_date ? 'border-red-500' : ''}`} />
        </Field>
      </div>
      <Field label="Status">
        <input name="status" value={form.status} onChange={onChange} className="block w-full p-2 border rounded" />
      </Field>
      <Field label="Notes">
        <input name="notes" value={form.notes} onChange={onChange} className="block w-full p-2 border rounded" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{submitLabel}</button>
      </div>
    </form>
  );
}

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [persons, setPersons] = useState([]);
  const [addForm, setAddForm] = useState(EMPTY);
  const [addErrors, setAddErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [editErrors, setEditErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [flash, setFlash] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const fetchAll = useCallback(() => {
    axios.get('/api/prescriptions').then(r => setPrescriptions(r.data)).catch(console.error);
    axios.get('/api/medications').then(r => setMedications(r.data)).catch(console.error);
    axios.get('/api/persons').then(r => setPersons(r.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const medName = (id) => medications.find(m => m.id === id)?.name ?? `#${id}`;
  const personName = (id) => persons.find(u => u.id === id)?.name ?? `#${id}`;

  const toPayload = (form) => ({
    ...form,
    medication_id: parseInt(form.medication_id),
    person_id: parseInt(form.person_id),
    refills_remaining: form.refills_remaining !== '' ? parseInt(form.refills_remaining) : null,
    date_prescribed: form.date_prescribed || null,
    date_filled: form.date_filled || null,
    expiration_date: form.expiration_date || null,
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errors = validate(addForm);
    if (Object.keys(errors).length) { setAddErrors(errors); return; }
    setAddErrors({});
    axios.post('/api/prescriptions', toPayload(addForm))
      .then(() => { fetchAll(); setAddForm(EMPTY); showFlash('Prescription added'); })
      .catch(console.error);
  };

  const openEdit = (rx) => {
    setEditForm({
      medication_id: String(rx.medication_id),
      person_id: String(rx.person_id),
      date_prescribed: rx.date_prescribed || '',
      date_filled: rx.date_filled || '',
      refills_remaining: rx.refills_remaining ?? '',
      expiration_date: rx.expiration_date || '',
      status: rx.status || 'active',
      notes: rx.notes || '',
    });
    setEditErrors({});
    setEditId(rx.id);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validate(editForm);
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setEditErrors({});
    axios.put(`/api/prescriptions/${editId}`, toPayload(editForm))
      .then(() => { fetchAll(); setEditId(null); showFlash('Prescription updated'); })
      .catch(console.error);
  };

  const confirmDelete = () => {
    axios.delete(`/api/prescriptions/${deleteTarget.id}`)
      .then(() => { fetchAll(); setDeleteTarget(null); showFlash('Prescription deleted'); })
      .catch(console.error);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prescriptions</h2>
      {flash && <div className="text-green-600 font-semibold mb-3">{flash}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-medium mb-3">Add Prescription</h3>
        <PrescriptionForm
          form={addForm} onChange={e => setAddForm({ ...addForm, [e.target.name]: e.target.value })}
          errors={addErrors} medications={medications} persons={persons}
          submitLabel="Add Prescription" onSubmit={handleAddSubmit}
        />
      </div>

      {prescriptions.length === 0
        ? <p className="text-gray-400 text-sm">No prescriptions found.</p>
        : (
          <ul className="space-y-2">
            {prescriptions.map(rx => {
              const expClass = expirationClass(rx.expiration_date);
              return (
                <li key={rx.id} className="bg-white p-3 rounded shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium">{medName(rx.medication_id)}</span>
                      <span className="text-gray-500 text-sm ml-2">for {personName(rx.person_id)}</span>
                      <div className="text-sm text-gray-500 mt-0.5 space-x-3">
                        {rx.status && <span className="capitalize">{rx.status}</span>}
                        {rx.refills_remaining != null && <span>{rx.refills_remaining} refill{rx.refills_remaining !== 1 ? 's' : ''} left</span>}
                        {rx.expiration_date && (
                          <span className={expClass}>
                            Exp: {rx.expiration_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 text-sm">
                      <button onClick={() => openEdit(rx)} className="text-blue-500 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(rx)} className="text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      }

      <Modal isOpen={editId !== null} onClose={() => setEditId(null)} title="Edit Prescription">
        <PrescriptionForm
          form={editForm} onChange={e => setEditForm({ ...editForm, [e.target.name]: e.target.value })}
          errors={editErrors} medications={medications} persons={persons}
          submitLabel="Save" onSubmit={handleEditSubmit} onCancel={() => setEditId(null)}
        />
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Prescription">
        <p className="mb-5">
          Delete the prescription for <strong>{deleteTarget && medName(deleteTarget.medication_id)}</strong>
          {' '}({deleteTarget && personName(deleteTarget.person_id)})? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

export default Prescriptions;
