import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
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
  if (rx.scripts_remaining <= 1) return 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
  const days = daysUntil(rx.next_eligible_date);
  if (days === null) return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
  if (days <= 0)  return 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
  if (days <= 7)  return 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
  return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
}

function StatusBadge({ rx }) {
  const days = daysUntil(rx.next_eligible_date);

  if (rx.scripts_remaining === 0) {
    return <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">No scripts left</span>;
  }
  if (rx.scripts_remaining <= 1) {
    return <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Last script</span>;
  }
  if (days === null) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">Not yet filled</span>;
  }
  if (days <= 0) {
    return <span className="text-xs font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">Eligible now</span>;
  }
  if (days <= 7) {
    return <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">Eligible in {days}d</span>;
  }
  return <span className="text-xs text-gray-400 dark:text-gray-500">Eligible in {days}d</span>;
}

export default function Refills() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError]                 = useState(null);
  const [fillModal, setFillModal]         = useState(null);
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
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Refills</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {prescriptions.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-1">No prescriptions tracked.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-3">Add a medication with type set to "Prescription" to start tracking refills.</p>
          <Link
            to="/settings"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {prescriptions.map(rx => (
          <li key={rx.id} className={`rounded-xl border px-4 py-3 shadow-sm ${urgencyClass(rx)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{rx.medication_name}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{rx.person_name}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>Scripts left: <strong className={rx.scripts_remaining <= 1 ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}>{rx.scripts_remaining}</strong></span>
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
                className="shrink-0 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Log fill
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={!!fillModal}
        onClose={() => setFillModal(null)}
        title={`Log fill — ${fillModal?.medication_name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fill date</label>
            <input
              type="date"
              value={fillDate}
              onChange={e => setFillDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Pharmacy (optional)</label>
            <input
              type="text"
              value={fillPharmacy}
              onChange={e => setFillPharmacy(e.target.value)}
              placeholder="e.g. CVS"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFillModal(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Cancel</button>
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
