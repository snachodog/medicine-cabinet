import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const TABS = ['Persons', 'Medications', 'Prescriptions', 'Contacts', 'Notifications', 'Activity'];
const SCHEDULES = ['morning', 'twice_daily', 'evening', 'three_times_daily', 'every_other_day', 'weekly', 'monthly', 'as_needed'];
const SCHEDULE_LABEL_MAP = {
  morning: 'Morning', twice_daily: 'Twice Daily', evening: 'Evening',
  three_times_daily: 'Three Times Daily', every_other_day: 'Every Other Day',
  weekly: 'Weekly', monthly: 'Monthly', as_needed: 'As Needed',
};
const MED_TYPES  = ['otc', 'supplement', 'rx'];
const TYPE_LABEL = { otc: 'OTC', supplement: 'Supplement', rx: 'Prescription' };

// ── Small reusable input ───────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</label>
      {children}
    </div>
  );
}
function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}
function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </select>
  );
}

// ── Sharing sub-modal ─────────────────────────────────────────────────────────
function SharingModal({ person, onClose }) {
  const { account } = useAuth();
  const [accessList, setAccessList] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  function loadAccess() {
    axios.get(`/api/persons/${person.id}/access`)
      .then(r => setAccessList(r.data));
  }
  useEffect(() => { loadAccess(); }, [person.id]);

  async function addUser() {
    if (!newUsername.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await axios.post(`/api/persons/${person.id}/access`, { username: newUsername.trim() });
      setNewUsername('');
      loadAccess();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not add user.');
    } finally {
      setAdding(false);
    }
  }

  async function removeUser(entry) {
    await axios.delete(`/api/persons/${person.id}/access/${entry.account_id}`);
    loadAccess();
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Sharing — ${person.name}`}>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Accounts that can log doses for {person.name}:</p>
          <ul className="space-y-2">
            {accessList.map(entry => (
              <li key={entry.account_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{entry.username}</span>
                {entry.account_id === account?.id ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">you</span>
                ) : (
                  <button
                    onClick={() => removeUser(entry)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Add a household member by username</p>
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="username"
            />
            <button
              onClick={addUser}
              disabled={adding || !newUsername.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0"
            >
              {adding ? '…' : 'Add'}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Done</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Persons tab ────────────────────────────────────────────────────────────────
function PersonsTab() {
  const [persons, setPersons]     = useState([]);
  const [modal, setModal]         = useState(null);  // null | 'add' | person-object
  const [sharingFor, setSharingFor] = useState(null); // person-object | null
  const [name, setName]             = useState('');
  const [allergies, setAllergies]   = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  function load() {
    axios.get('/api/persons').then(r => setPersons(r.data));
  }
  useEffect(() => { load(); }, []);

  function openAdd()    { setModal('add'); setName(''); setAllergies(''); setNotes(''); setError(null); }
  function openEdit(p)  { setModal(p); setName(p.name); setAllergies(p.allergies || ''); setNotes(p.notes || ''); setError(null); }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/persons', { name, allergies: allergies || undefined, notes: notes || undefined });
      } else {
        await axios.patch(`/api/persons/${modal.id}`, { name, allergies: allergies || undefined, notes: notes || undefined });
      }
      setModal(null);
      load();
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function del(p) {
    if (!confirm(`Delete ${p.name}? This will remove all their medication data.`)) return;
    await axios.delete(`/api/persons/${p.id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{persons.length} household member{persons.length !== 1 ? 's' : ''}</p>
        <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Add person
        </button>
      </div>

      <ul className="space-y-2">
        {persons.map(p => (
          <li key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
              {p.allergies && (
                <p className="text-xs text-red-500 mt-0.5">Allergies: {p.allergies}</p>
              )}
              {p.notes && <p className="text-xs text-gray-400 dark:text-gray-500">{p.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSharingFor(p)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:underline">Sharing</button>
              <a href={`/api/persons/${p.id}/export.pdf`} download className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 hover:underline">PDF</a>
              <button onClick={() => openEdit(p)}      className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => del(p)}           className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit / add modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add person' : 'Edit person'}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Allergies (optional)">
            <Input
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
              placeholder="e.g. penicillin, sulfa drugs"
            />
          </Field>
          <Field label="Notes (optional)"><Input value={notes} onChange={e => setNotes(e.target.value)} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button onClick={save} disabled={saving || !name.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sharing modal */}
      {sharingFor && (
        <SharingModal person={sharingFor} onClose={() => setSharingFor(null)} />
      )}
    </div>
  );
}

// ── Medications tab ────────────────────────────────────────────────────────────
function MedicationsTab() {
  const [persons, setPersons]         = useState([]);
  const [selectedPerson, setSelected] = useState(null);
  const [meds, setMeds]               = useState([]);
  const [modal, setModal]             = useState(null);
  const [catalog, setCatalog]         = useState([]);
  const [catalogQ, setCatalogQ]       = useState('');
  const [form, setForm]               = useState({ name: '', type: 'otc', dose_amount: '', schedule: 'morning', notes: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    axios.get('/api/persons').then(r => {
      setPersons(r.data);
      if (r.data.length > 0) setSelected(r.data[0].id);
    });
  }, []);

  const loadMeds = useCallback(() => {
    if (!selectedPerson) return;
    axios.get(`/api/medications/person/${selectedPerson}`, { params: { active_only: false } })
      .then(r => setMeds(r.data));
  }, [selectedPerson]);

  useEffect(() => { loadMeds(); }, [loadMeds]);

  useEffect(() => {
    if (catalogQ.length < 2) { setCatalog([]); return; }
    axios.get('/api/catalog', { params: { q: catalogQ } })
      .then(r => setCatalog(r.data.slice(0, 8)));
  }, [catalogQ]);

  function openAdd() {
    setModal('add');
    setForm({ name: '', type: 'otc', dose_amount: '', schedule: 'morning', notes: '' });
    setCatalogQ('');
    setCatalog([]);
  }

  function openEdit(m) {
    setModal(m);
    setForm({ name: m.name, type: m.type, dose_amount: m.dose_amount || '', schedule: m.schedule, notes: m.notes || '' });
  }

  function selectCatalog(entry) {
    setForm(f => ({
      ...f,
      name: entry.name,
      type: entry.type,
      dose_amount: entry.default_dose_amount || '',
    }));
    setCatalogQ(entry.name);
    setCatalog([]);
  }

  async function save() {
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/medications', {
          person_id: selectedPerson,
          name: form.name,
          type: form.type,
          dose_amount: form.dose_amount || undefined,
          schedule: form.schedule,
          notes: form.notes || undefined,
        });
      } else {
        await axios.patch(`/api/medications/${modal.id}`, {
          name: form.name,
          type: form.type,
          dose_amount: form.dose_amount || undefined,
          schedule: form.schedule,
          notes: form.notes || undefined,
        });
      }
      setModal(null);
      loadMeds();
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m) {
    await axios.patch(`/api/medications/${m.id}`, { is_active: !m.is_active });
    loadMeds();
  }

  async function deleteMed(m) {
    if (!confirm(`Permanently delete "${m.name}"? This cannot be undone.`)) return;
    await axios.delete(`/api/medications/${m.id}`);
    setModal(null);
    loadMeds();
  }

  return (
    <div className="space-y-4">
      {/* Person selector */}
      {persons.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {persons.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedPerson === p.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Add medication
        </button>
      </div>

      <ul className="space-y-2">
        {meds.map(m => (
          <li key={m.id} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${m.is_active ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 opacity-60'}`}>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{m.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{TYPE_LABEL[m.type]} · {SCHEDULE_LABEL_MAP[m.schedule] ?? m.schedule} {m.dose_amount ? `· ${m.dose_amount}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(m)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => toggleActive(m)} className="text-sm text-gray-400 hover:underline">
                {m.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add medication' : 'Edit medication'}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {modal === 'add' && (
            <Field label="Search catalog">
              <div className="relative">
                <Input
                  value={catalogQ}
                  onChange={e => { setCatalogQ(e.target.value); setForm(f => ({ ...f, name: e.target.value })); }}
                  placeholder="Type to search…"
                />
                {catalog.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {catalog.map(c => (
                      <li key={c.id}>
                        <button
                          onClick={() => selectCatalog(c)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between"
                        >
                          <span>{c.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{TYPE_LABEL[c.type]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>
          )}

          <Field label="Name">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {MED_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </Select>
            </Field>
            <Field label="Schedule">
              <Select value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}>
                {SCHEDULES.map(s => <option key={s} value={s}>{SCHEDULE_LABEL_MAP[s]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Dose amount (optional)">
            <Input value={form.dose_amount} onChange={e => setForm(f => ({ ...f, dose_amount: e.target.value }))} placeholder="e.g. 30mg" />
          </Field>
          <Field label="Notes (optional)">
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>

          <div className="flex justify-between items-center pt-2">
            {modal !== 'add' && (
              <button
                onClick={() => deleteMed(modal)}
                className="px-4 py-2 text-sm text-red-500 hover:text-red-700"
              >
                Delete permanently
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Prescriptions tab ──────────────────────────────────────────────────────────
function PrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [persons, setPersons]             = useState([]);
  const [allMeds, setAllMeds]             = useState([]);
  const [loadError, setLoadError]         = useState(null);
  const [modal, setModal]                 = useState(null);
  const [form, setForm]                   = useState({
    medication_id: '', prescriber: '', pharmacy: '',
    days_supply: 30, scripts_remaining: 6,
    last_fill_date: '', next_eligible_date: '', expiration_date: '', co_pay: '',
  });
  const [providerSuggestions, setProviderSuggestions] = useState([]);
  const [pharmacySuggestions, setPharmacySuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  async function load() {
    setLoadError(null);
    try {
      const [rxRes, pRes] = await Promise.all([
        axios.get('/api/prescriptions'),
        axios.get('/api/persons'),
      ]);
      setPrescriptions(rxRes.data);
      const ps = pRes.data;
      setPersons(ps);
      const medArrays = await Promise.all(
        ps.map(p => axios.get(`/api/medications/person/${p.id}`, { params: { active_only: false } }))
      );
      const eligible = medArrays.flatMap((r, i) =>
        r.data.map(m => ({ ...m, person_name: ps[i].name, person_id: ps[i].id }))
      );
      setAllMeds(eligible);
    } catch (e) {
      setLoadError(e.response?.data?.detail || 'Could not load prescriptions.');
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setError(null);
    setModal('add');
    setProviderSuggestions([]);
    setPharmacySuggestions([]);
    setForm({ medication_id: '', prescriber: '', pharmacy: '', days_supply: 30, scripts_remaining: 6, last_fill_date: '', next_eligible_date: '', expiration_date: '', co_pay: '' });
  }

  function openEdit(rx) {
    setError(null);
    setModal(rx);
    setProviderSuggestions([]);
    setPharmacySuggestions([]);
    setForm({
      medication_id: rx.medication_id,
      prescriber: rx.prescriber || '',
      pharmacy: rx.pharmacy || '',
      days_supply: rx.days_supply,
      scripts_remaining: rx.scripts_remaining,
      last_fill_date: rx.last_fill_date || '',
      next_eligible_date: rx.next_eligible_date || '',
      expiration_date: rx.expiration_date || '',
      co_pay: rx.co_pay != null ? String(rx.co_pay) : '',
    });
  }

  async function fetchProviderSuggestions(q) {
    if (q.length < 2) { setProviderSuggestions([]); return; }
    const r = await axios.get('/api/contacts/providers/search', { params: { q } });
    setProviderSuggestions(r.data);
  }

  async function fetchPharmacySuggestions(q) {
    if (q.length < 2) { setPharmacySuggestions([]); return; }
    const r = await axios.get('/api/contacts/pharmacies/search', { params: { q } });
    setPharmacySuggestions(r.data);
  }

  async function save() {
    setSaving(true);
    try {
      const body = {
        prescriber: form.prescriber || undefined,
        pharmacy: form.pharmacy || undefined,
        days_supply: Number(form.days_supply),
        scripts_remaining: Number(form.scripts_remaining),
        last_fill_date: form.last_fill_date || undefined,
        next_eligible_date: form.next_eligible_date || undefined,
        expiration_date: form.expiration_date || undefined,
        co_pay: form.co_pay !== '' ? Number(form.co_pay) : undefined,
      };
      if (modal === 'add') {
        await axios.post('/api/prescriptions', { ...body, medication_id: Number(form.medication_id) });
      } else {
        await axios.patch(`/api/prescriptions/${modal.id}`, body);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function del(rx) {
    if (!confirm(`Remove prescription for ${rx.medication_name}?`)) return;
    await axios.delete(`/api/prescriptions/${rx.id}`);
    load();
  }

  const untracked = allMeds.filter(m => !prescriptions.find(rx => rx.medication_id === m.id));

  // Build per-person groups for the medication dropdown
  const untrackedByPerson = persons
    .map(p => ({ person: p, meds: untracked.filter(m => m.person_id === p.id) }))
    .filter(g => g.meds.length > 0);

  return (
    <div className="space-y-4">
      {loadError && <p className="text-red-500 text-sm">{loadError}</p>}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} tracked</p>
        <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Add prescription
        </button>
      </div>

      <ul className="space-y-2">
        {prescriptions.map(rx => (
          <li key={rx.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">{rx.person_name}</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{rx.medication_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Scripts remaining: {rx.scripts_remaining} · {rx.days_supply}d supply
                  {rx.prescriber ? ` · ${rx.prescriber}` : ''}
                  {rx.co_pay != null ? ` · $${Number(rx.co_pay).toFixed(2)} co-pay` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(rx)} className="text-sm text-blue-600 hover:underline">Edit</button>
                <button onClick={() => del(rx)}      className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add prescription' : `Edit prescription${modal?.person_name ? ` — ${modal.person_name}` : ''}`}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {modal === 'add' && (
            <Field label="Medication">
              {allMeds.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 py-2">
                  No medications found. Add them in the Medications tab first.
                </p>
              ) : untracked.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  All eligible medications already have prescriptions.
                </p>
              ) : (
                <Select value={form.medication_id} onChange={e => setForm(f => ({ ...f, medication_id: e.target.value }))}>
                  <option value="">Select a medication…</option>
                  {untrackedByPerson.map(({ person, meds }) => (
                    <optgroup key={person.id} label={person.name}>
                      {meds.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Scripts remaining">
              <Input type="number" min="0" value={form.scripts_remaining} onChange={e => setForm(f => ({ ...f, scripts_remaining: e.target.value }))} />
            </Field>
            <Field label="Days supply">
              <Input type="number" min="1" value={form.days_supply} onChange={e => setForm(f => ({ ...f, days_supply: e.target.value }))} />
            </Field>
          </div>
          <Field label="Prescriber (optional)">
            <div className="relative">
              <Input
                value={form.prescriber}
                onChange={e => { setForm(f => ({ ...f, prescriber: e.target.value })); fetchProviderSuggestions(e.target.value); }}
                onBlur={() => setTimeout(() => setProviderSuggestions([]), 150)}
                placeholder="Start typing to search saved providers…"
              />
              {providerSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {providerSuggestions.map(p => (
                    <li key={p.id}>
                      <button
                        onMouseDown={() => { setForm(f => ({ ...f, prescriber: p.name })); setProviderSuggestions([]); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between"
                      >
                        <span>{p.name}</span>
                        {p.specialty && <span className="text-xs text-gray-400 dark:text-gray-500">{p.specialty}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label="Pharmacy (optional)">
            <div className="relative">
              <Input
                value={form.pharmacy}
                onChange={e => { setForm(f => ({ ...f, pharmacy: e.target.value })); fetchPharmacySuggestions(e.target.value); }}
                onBlur={() => setTimeout(() => setPharmacySuggestions([]), 150)}
                placeholder="Start typing to search saved pharmacies…"
              />
              {pharmacySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {pharmacySuggestions.map(p => (
                    <li key={p.id}>
                      <button
                        onMouseDown={() => { setForm(f => ({ ...f, pharmacy: p.name })); setPharmacySuggestions([]); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between"
                      >
                        <span>{p.name}</span>
                        {p.phone && <span className="text-xs text-gray-400 dark:text-gray-500">{p.phone}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label="Co-pay (optional)">
            <Input type="number" min="0" step="0.01" value={form.co_pay} onChange={e => setForm(f => ({ ...f, co_pay: e.target.value }))} placeholder="0.00" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last fill date">
              <Input type="date" value={form.last_fill_date} onChange={e => setForm(f => ({ ...f, last_fill_date: e.target.value }))} />
            </Field>
            <Field label="Next eligible date">
              <Input type="date" value={form.next_eligible_date} onChange={e => setForm(f => ({ ...f, next_eligible_date: e.target.value }))} />
            </Field>
          </div>
          <Field label="Prescription expiration date">
            <Input type="date" value={form.expiration_date} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button
              onClick={save}
              disabled={saving || (modal === 'add' && !form.medication_id)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Notifications tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs]         = useState(null);
  const [form, setForm]           = useState({ ntfy_url: '', ntfy_token: '', refill_reminder_days: 7, scripts_low_threshold: 2, email_enabled: false });
  const [email, setEmail]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [subscribeUrl, setSubscribeUrl] = useState(null);
  const [tokenGenerating, setTokenGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/notifications/preferences'),
      axios.get('/api/auth/me'),
    ]).then(([prefsRes, meRes]) => {
      setPrefs(prefsRes.data);
      setForm({
        ntfy_url: prefsRes.data.ntfy_url || '',
        ntfy_token: prefsRes.data.ntfy_token || '',
        refill_reminder_days: prefsRes.data.refill_reminder_days,
        scripts_low_threshold: prefsRes.data.scripts_low_threshold,
        email_enabled: prefsRes.data.email_enabled,
      });
      setEmail(meRes.data.email || '');
      if (prefsRes.data.calendar_token) {
        setSubscribeUrl(`${window.location.origin}/api/calendar/subscribe.ics?token=${prefsRes.data.calendar_token}`);
      }
    });
  }, []);

  async function generateToken() {
    setTokenGenerating(true);
    try {
      const r = await axios.post('/api/calendar/token');
      setSubscribeUrl(`${window.location.origin}${r.data.subscribe_url}`);
    } finally {
      setTokenGenerating(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        axios.patch('/api/notifications/preferences', {
          ntfy_url: form.ntfy_url || null,
          ntfy_token: form.ntfy_token || null,
          refill_reminder_days: Number(form.refill_reminder_days),
          scripts_low_threshold: Number(form.scripts_low_threshold),
          email_enabled: form.email_enabled,
        }),
        axios.patch('/api/auth/me', { email: email || null }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Email notifications</h3>
        <div className="space-y-3">
          <Field label="Email address">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.email_enabled}
              onChange={e => setForm(f => ({ ...f, email_enabled: e.target.checked }))}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Send email alerts 7 and 30 days before prescription expiration
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">ntfy push notifications</h3>
        <div className="space-y-3">
          <Field label="ntfy topic URL">
            <Input value={form.ntfy_url} onChange={e => setForm(f => ({ ...f, ntfy_url: e.target.value }))} placeholder="https://ntfy.sh/your-topic" />
          </Field>
          <Field label="ntfy token (if private topic)">
            <Input type="password" value={form.ntfy_token} onChange={e => setForm(f => ({ ...f, ntfy_token: e.target.value }))} placeholder="tk_…" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Reminder thresholds</h3>
        <div className="space-y-3">
          <Field label="Refill reminder (days before eligible)">
            <Input type="number" min="1" value={form.refill_reminder_days} onChange={e => setForm(f => ({ ...f, refill_reminder_days: e.target.value }))} />
          </Field>
          <Field label="Low scripts alert (when scripts remaining ≤)">
            <Input type="number" min="1" value={form.scripts_low_threshold} onChange={e => setForm(f => ({ ...f, scripts_low_threshold: e.target.value }))} />
          </Field>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50"
      >
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save preferences'}
      </button>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Calendar feed</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Import upcoming refill dates into Apple Calendar, Google Calendar, Outlook, or any app that supports iCal.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/calendar/feed.ics"
            download="medicine_cabinet.ics"
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Download .ics
          </a>
          <button
            onClick={generateToken}
            disabled={tokenGenerating}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {tokenGenerating ? 'Generating…' : subscribeUrl ? 'Regenerate subscribe URL' : 'Generate subscribe URL'}
          </button>
        </div>
        {subscribeUrl && (
          <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-200">{subscribeUrl}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Subscribe to this URL in your calendar app for automatic updates. Keep it private — anyone with this URL can read your refill schedule. Regenerating will break existing subscriptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Contacts tab ──────────────────────────────────────────────────────────────
function ContactsTab() {
  const [section, setSection]   = useState('providers'); // 'providers' | 'pharmacies'
  const [items, setItems]       = useState([]);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const isProvider = section === 'providers';

  function load() {
    axios.get(`/api/contacts/${section}`).then(r => setItems(r.data));
  }
  useEffect(() => { load(); }, [section]);

  function openAdd() {
    setError(null);
    setModal('add');
    setForm(isProvider
      ? { name: '', practice_name: '', specialty: '', phone: '', address: '', website: '', notes: '' }
      : { name: '', phone: '', address: '', website: '', notes: '' });
  }

  function openEdit(item) {
    setError(null);
    setModal(item);
    setForm(isProvider
      ? { name: item.name, practice_name: item.practice_name || '', specialty: item.specialty || '', phone: item.phone || '', address: item.address || '', website: item.website || '', notes: item.notes || '' }
      : { name: item.name, phone: item.phone || '', address: item.address || '', website: item.website || '', notes: item.notes || '' });
  }

  async function save() {
    setSaving(true);
    try {
      const endpoint = `/api/contacts/${section}`;
      if (modal === 'add') {
        await axios.post(endpoint, form);
      } else {
        await axios.patch(`${endpoint}/${modal.id}`, form);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function del(item) {
    const label = isProvider ? 'provider' : 'pharmacy';
    if (!confirm(`Delete ${item.name}?`)) return;
    await axios.delete(`/api/contacts/${section}/${item.id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['providers', 'pharmacies'].map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              section === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            }`}
          >
            {s === 'providers' ? 'Prescribers' : 'Pharmacies'}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Add {isProvider ? 'prescriber' : 'pharmacy'}
        </button>
      </div>

      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {isProvider && item.practice_name ? `${item.practice_name} · ` : ''}
                {isProvider && item.specialty ? `${item.specialty} · ` : ''}
                {item.phone || ''}
                {item.address ? (item.phone ? ` · ${item.address}` : item.address) : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(item)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => del(item)}      className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No {isProvider ? 'prescribers' : 'pharmacies'} saved yet.</p>
        )}
      </ul>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? `Add ${isProvider ? 'prescriber' : 'pharmacy'}` : `Edit ${isProvider ? 'prescriber' : 'pharmacy'}`}>
        <div className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Field label="Name"><Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          {isProvider && (
            <Field label="Practice / Clinic name (optional)"><Input value={form.practice_name || ''} onChange={e => setForm(f => ({ ...f, practice_name: e.target.value }))} placeholder="e.g. City Medical Group" /></Field>
          )}
          {isProvider && (
            <Field label="Specialty (optional)"><Input value={form.specialty || ''} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Psychiatry" /></Field>
          )}
          <Field label="Phone (optional)"><Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 555-5555" /></Field>
          <Field label="Address (optional)"><Input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Field>
          <Field label="Website (optional)"><Input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" /></Field>
          <Field label="Notes (optional)"><Input value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button onClick={save} disabled={saving || !form.name?.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// ── Activity tab ──────────────────────────────────────────────────────────────
const ACTION_STYLE = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-500',
};
const ACTION_LABEL = { create: 'Added', update: 'Updated', delete: 'Removed' };

function ActivityTab() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/audit', { params: { limit: 100 } })
      .then(r => setLogs(r.data))
      .catch(() => setError('Could not load activity.'));
  }, []);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (logs.length === 0) return <p className="text-gray-400 text-sm">No activity yet.</p>;

  return (
    <ul className="space-y-1">
      {logs.map(log => (
        <li key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <span className={`text-xs font-semibold w-16 shrink-0 pt-0.5 ${ACTION_STYLE[log.action] || 'text-gray-500 dark:text-gray-400'}`}>
            {ACTION_LABEL[log.action] || log.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{log.detail || `${log.entity_type} #${log.entity_id}`}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {log.username || 'system'} · {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Main Settings page ─────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState(0);
  const CONTENT = [<PersonsTab />, <MedicationsTab />, <PrescriptionsTab />, <ContactsTab />, <NotificationsTab />, <ActivityTab />];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div>{CONTENT[tab]}</div>
    </div>
  );
}
