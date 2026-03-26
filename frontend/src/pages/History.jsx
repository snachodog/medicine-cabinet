import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function computeStreak(logs, medicationId) {
  const dates = [...new Set(
    logs
      .filter(l => l.medication_id === medicationId)
      .map(l => l.taken_at.slice(0, 10))
  )].sort().reverse();

  if (dates.length === 0) return 0;

  let streak = 0;
  let expected = new Date().toISOString().slice(0, 10);

  for (const d of dates) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else if (streak === 0 && d === daysAgo(1)) {
      // allow streak starting yesterday
      streak++;
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function History() {
  const [persons, setPersons]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [meds, setMeds]             = useState([]);
  const [logs, setLogs]             = useState([]);
  const [expanded, setExpanded]     = useState({});
  const [error, setError]           = useState(null);

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
    const since = daysAgo(30);
    Promise.all([
      axios.get(`/api/medications/person/${selectedId}`),
      axios.get(`/api/dose-logs/person/${selectedId}`, { params: { since, limit: 500 } }),
    ])
      .then(([m, l]) => {
        setMeds(m.data);
        setLogs(l.data);
      })
      .catch(() => setError('Could not load history.'));
  }, [selectedId]);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleExpand(medId) {
    setExpanded(s => ({ ...s, [medId]: !s[medId] }));
  }

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

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {meds.length === 0 && !error && (
        <p className="text-gray-400 text-sm">No medications found.</p>
      )}

      <ul className="space-y-3">
        {meds.map(med => {
          const streak   = computeStreak(logs, med.id);
          const medLogs  = logs.filter(l => l.medication_id === med.id);
          const isOpen   = !!expanded[med.id];

          return (
            <li key={med.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(med.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-medium text-gray-800">{med.name}</p>
                  {med.dose_amount && (
                    <p className="text-xs text-gray-400">{med.dose_amount}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {streak > 0 && (
                    <span className="text-sm font-semibold text-orange-500">
                      🔥 {streak}-day streak
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{medLogs.length} doses / 30d</span>
                  <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3">
                  {medLogs.length === 0 ? (
                    <p className="text-sm text-gray-400">No doses logged in the last 30 days.</p>
                  ) : (
                    <ul className="space-y-1">
                      {medLogs.map(log => (
                        <li key={log.id} className="flex justify-between text-sm text-gray-600">
                          <span>{formatDate(log.taken_at)}</span>
                          <span className="text-gray-400">{formatTime(log.taken_at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
