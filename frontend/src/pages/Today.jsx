import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import axios from 'axios';

const SCHEDULE_ORDER = ['morning', 'twice_daily', 'evening', 'three_times_daily', 'every_other_day', 'weekly', 'monthly', 'as_needed'];
const SCHEDULE_LABEL = {
  morning:           'Morning',
  twice_daily:       'Twice Daily',
  evening:           'Evening',
  three_times_daily: 'Three Times Daily',
  every_other_day:   'Every Other Day',
  weekly:            'Weekly',
  monthly:           'Monthly',
  as_needed:         'As Needed',
};

// Returns YYYY-MM-DD for today in the browser's local timezone.
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns a Date object set to 00:00:00.000 local time today.
// Comparing log timestamps against this avoids all UTC/string ambiguity —
// a dose at 11 PM local (which may be UTC-tomorrow) correctly falls before
// the NEXT day's local midnight and will not show as taken today.
function localMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Today() {
  const [persons, setPersons]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [meds, setMeds]             = useState([]);
  const [logs, setLogs]             = useState([]);
  const [logging, setLogging]       = useState({});
  const [error, setError]           = useState(null);

  useEffect(() => {
    axios.get('/api/persons')
      .then(r => {
        setPersons(r.data);
        if (r.data.length > 0) setSelectedId(r.data[0].id);
      })
      .catch(() => setError('Could not load persons.'));
  }, []);

  const loadedDay = useRef(todayISO());

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

  // Refresh when the calendar day rolls over — covers returning to the tab and
  // staying on the page through midnight.
  useEffect(() => {
    function checkRollover() {
      const today = todayISO();
      if (today !== loadedDay.current) {
        loadedDay.current = today;
        loadData();
      }
    }
    document.addEventListener('visibilitychange', checkRollover);
    const timer = setInterval(checkRollover, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', checkRollover);
      clearInterval(timer);
    };
  }, [loadData]);

  // Returns all logs for a medication taken today (PRN may have multiple)
  function takenTodayLogs(medicationId) {
    const midnight = localMidnight();
    return logs.filter(
      l => l.medication_id === medicationId && new Date(l.taken_at) >= midnight
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

  // Meds with a schedule not in SCHEDULE_ORDER (legacy or custom values)
  const ungrouped = meds.filter(m => !SCHEDULE_ORDER.includes(m.schedule));

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
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {persons.length === 1 && (
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{persons[0]?.name}</h2>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {meds.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">No active medications yet.</p>
          <Link
            to="/settings"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add medications in Settings
          </Link>
        </div>
      )}

      {/* Scheduled medication groups */}
      {SCHEDULE_ORDER.map(schedule => {
        const group = grouped[schedule];
        if (group.length === 0) return null;
        const isPRN = schedule === 'as_needed';
        return (
          <section key={schedule}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              {SCHEDULE_LABEL[schedule]}
            </h3>
            <ul className="space-y-2">
              {group.map(med => {
                const todayLogs = takenTodayLogs(med.id);
                const taken = todayLogs.length > 0;
                const busy  = !!logging[med.id];

                if (isPRN) {
                  // As-needed: always show "Log dose", display count + times taken today
                  return (
                    <li
                      key={med.id}
                      className="flex items-start justify-between rounded-xl px-4 py-3 shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{med.name}</p>
                        {med.dose_amount && (
                          <p className="text-sm text-gray-400 dark:text-gray-500">{med.dose_amount}</p>
                        )}
                        {taken && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              Taken {todayLogs.length}× today
                            </span>
                            {[...todayLogs].reverse().map((log, i) => (
                              <span key={log.id} className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(log.taken_at)}</span>
                                {i === 0 && (
                                  <button
                                    onClick={() => handleUndo(log)}
                                    className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    title="Undo last dose"
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleLog(med)}
                        disabled={busy}
                        className="ml-4 shrink-0 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {busy ? '…' : 'Log dose'}
                      </button>
                    </li>
                  );
                }

                // Regular scheduled med: one-and-done per day
                const log = todayLogs[0] ?? null;
                return (
                  <li
                    key={med.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 shadow-sm transition-colors ${
                      taken
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${taken ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'}`}>
                        {med.name}
                      </p>
                      {med.dose_amount && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">{med.dose_amount}</p>
                      )}
                      {taken && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
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
                            className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
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

      {/* Catch-all for any medication with an unrecognized schedule */}
      {ungrouped.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Other
          </h3>
          <ul className="space-y-2">
            {ungrouped.map(med => {
              const todayLogs = takenTodayLogs(med.id);
              const taken = todayLogs.length > 0;
              const log = todayLogs[0] ?? null;
              const busy = !!logging[med.id];
              return (
                <li
                  key={med.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 shadow-sm transition-colors ${
                    taken
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${taken ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'}`}>
                      {med.name}
                    </p>
                    {med.dose_amount && <p className="text-sm text-gray-400 dark:text-gray-500">{med.dose_amount}</p>}
                    {taken && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Taken at {formatTime(log.taken_at)}</p>}
                  </div>
                  <div className="ml-4 shrink-0">
                    {taken ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 text-xl">✓</span>
                        <button onClick={() => handleUndo(log)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Undo</button>
                      </div>
                    ) : (
                      <button onClick={() => handleLog(med)} disabled={busy} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {busy ? '…' : 'Took it'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
