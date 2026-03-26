import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const SCHEDULE_ORDER = ['morning', 'evening', 'as_needed'];
const SCHEDULE_LABEL = { morning: 'Morning', evening: 'Evening', as_needed: 'As Needed' };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Today() {
  const [persons, setPersons]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [meds, setMeds]             = useState([]);
  const [logs, setLogs]             = useState([]);   // today's dose logs
  const [logging, setLogging]       = useState({});   // medicationId → true while in-flight
  const [error, setError]           = useState(null);

  // Load accessible persons once
  useEffect(() => {
    axios.get('/api/persons')
      .then(r => {
        setPersons(r.data);
        if (r.data.length > 0) setSelectedId(r.data[0].id);
      })
      .catch(() => setError('Could not load persons.'));
  }, []);

  const loadData = useCallback(() => {
    if (!selectedId) return;
    const medsReq = axios.get(`/api/medications/person/${selectedId}`);
    const logsReq = axios.get(`/api/dose-logs/person/${selectedId}`, {
      params: { since: todayISO(), limit: 200 },
    });
    Promise.all([medsReq, logsReq])
      .then(([m, l]) => {
        setMeds(m.data);
        setLogs(l.data);
      })
      .catch(() => setError('Could not load medications.'));
  }, [selectedId]);

  useEffect(() => { loadData(); }, [loadData]);

  function takenTodayLog(medicationId) {
    const today = todayISO();
    return logs.find(
      l => l.medication_id === medicationId &&
           l.taken_at.slice(0, 10) === today
    );
  }

  async function handleLog(med) {
    setLogging(s => ({ ...s, [med.id]: true }));
    try {
      await axios.post('/api/dose-logs', {
        medication_id: med.id,
        person_id: selectedId,
      });
      loadData();
    } catch {
      setError('Could not log dose.');
    } finally {
      setLogging(s => ({ ...s, [med.id]: false }));
    }
  }

  async function handleUndo(log) {
    try {
      await axios.delete(`/api/dose-logs/${log.id}`);
      loadData();
    } catch {
      setError('Could not undo.');
    }
  }

  const grouped = SCHEDULE_ORDER.reduce((acc, s) => {
    acc[s] = meds.filter(m => m.schedule === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Person tabs */}
      {persons.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {persons.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedId === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {persons.length === 1 && (
        <h2 className="text-lg font-semibold text-gray-700">{persons[0]?.name}</h2>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {meds.length === 0 && !error && (
        <p className="text-gray-400 text-sm">No active medications. Add some in Settings.</p>
      )}

      {/* Medication groups */}
      {SCHEDULE_ORDER.map(schedule => {
        const group = grouped[schedule];
        if (group.length === 0) return null;
        return (
          <section key={schedule}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {SCHEDULE_LABEL[schedule]}
            </h3>
            <ul className="space-y-2">
              {group.map(med => {
                const log = takenTodayLog(med.id);
                const taken = !!log;
                const busy  = !!logging[med.id];
                return (
                  <li
                    key={med.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 shadow-sm transition-colors ${
                      taken ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${taken ? 'text-green-800' : 'text-gray-800'}`}>
                        {med.name}
                      </p>
                      {med.dose_amount && (
                        <p className="text-sm text-gray-400">{med.dose_amount}</p>
                      )}
                      {taken && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Taken at {formatTime(log.taken_at)}
                        </p>
                      )}
                    </div>

                    <div className="ml-4 shrink-0">
                      {taken ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 text-xl">✓</span>
                          <button
                            onClick={() => handleUndo(log)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLog(med)}
                          disabled={busy}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {busy ? '…' : 'Took it'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
