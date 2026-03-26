import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(todayISO());
  return Math.ceil(diff / 86400000);
}

function urgencyClass(rx) {
  if (rx.scripts_remaining <= 1) return 'border-red-300 bg-red-50';
  const days = daysUntil(rx.next_eligible_date);
  if (days === null) return 'border-gray-200 bg-white';
  if (days <= 0)  return 'border-orange-300 bg-orange-50';
  if (days <= 7)  return 'border-yellow-300 bg-yellow-50';
  return 'border-gray-200 bg-white';
}

function StatusBadge({ rx }) {
  const days = daysUntil(rx.next_eligible_date);

  if (rx.scripts_remaining === 0) {
    return <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">No scripts left</span>;
  }
  if (rx.scripts_remaining <= 1) {
    return <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Last script</span>;
  }
  if (days === null) {
    return <span className="text-xs text-gray-400">Not yet filled</span>;
  }
  if (days <= 0) {
    return <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Eligible now</span>;
  }
  if (days <= 7) {
    return <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Eligible in {days}d</span>;
  }
  return <span className="text-xs text-gray-400">Eligible in {days}d</span>;
}

export default function Refills() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError]                 = useState(null);
  const [fillModal, setFillModal]         = useState(null);  // prescription object
  const [fillDate, setFillDate]           = useState(todayISO());
  const [fillPharmacy, setFillPharmacy]   = useState('');
  const [saving, setSaving]               = useState(false);

  function load() {
    axios.get('/api/prescriptions')
      .then(r => setPrescriptions(r.data))
      .catch(() => setError('Could not load prescriptions.'));
  }

  useEffect(() => { load(); }, []);

  async function submitFill() {
    setSaving(true);
    try {
      await axios.post(`/api/prescriptions/${fillModal.id}/fills`, {
        fill_date: fillDate,
        pharmacy: fillPharmacy || undefined,
      });
      setFillModal(null);
      setFillPharmacy('');
      load();
    } catch {
      setError('Could not save fill.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Refills</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {prescriptions.length === 0 && !error && (
        <p className="text-gray-400 text-sm">No prescriptions tracked. Add Rx medications in Settings.</p>
      )}

      <ul className="space-y-3">
        {prescriptions.map(rx => (
          <li key={rx.id} className={`rounded-xl border px-4 py-3 shadow-sm ${urgencyClass(rx)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 truncate">{rx.medication_name}</p>
                  <span className="text-xs text-gray-400">{rx.person_name}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>Scripts left: <strong className={rx.scripts_remaining <= 1 ? 'text-red-600' : 'text-gray-700'}>{rx.scripts_remaining}</strong></span>
                  {rx.last_fill_date && <span>Last filled: {rx.last_fill_date}</span>}
                  {rx.next_eligible_date && <span>Next eligible: {rx.next_eligible_date}</span>}
                  {rx.prescriber && <span>Dr. {rx.prescriber}</span>}
                </div>

                <div className="mt-2">
                  <StatusBadge rx={rx} />
                </div>
              </div>

              <button
                onClick={() => { setFillModal(rx); setFillDate(todayISO()); }}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-600 text-sm hover:bg-blue-50 transition-colors"
              >
                Log fill
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Log fill modal */}
      <Modal
        isOpen={!!fillModal}
        onClose={() => setFillModal(null)}
        title={`Log fill — ${fillModal?.medication_name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fill date</label>
            <input
              type="date"
              value={fillDate}
              onChange={e => setFillDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy (optional)</label>
            <input
              type="text"
              value={fillPharmacy}
              onChange={e => setFillPharmacy(e.target.value)}
              placeholder="e.g. CVS"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFillModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              onClick={submitFill}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save fill'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
