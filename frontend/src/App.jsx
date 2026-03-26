import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Today from './pages/Today';
import Refills from './pages/Refills';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';

const NAV_LINKS = [
  { to: '/',        label: 'Today'    },
  { to: '/refills', label: 'Refills'  },
  { to: '/history', label: 'History'  },
  { to: '/settings',label: 'Settings' },
];

function NavLink({ to, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`hover:text-blue-600 transition-colors ${active ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
    >
      {label}
    </Link>
  );
}

function AppShell() {
  const { account, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            Medicine Cabinet
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => <NavLink key={l.to} {...l} />)}
            {account && (
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 text-sm transition-colors"
              >
                Sign out
              </button>
            )}
          </nav>

          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setNavOpen(o => !o)}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600" />
          </button>
        </div>

        {navOpen && (
          <nav className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-4">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} {...l} onClick={() => setNavOpen(false)} />
            ))}
            {account && (
              <button
                onClick={() => { setNavOpen(false); logout(); }}
                className="text-left text-red-500 text-sm"
              >
                Sign out ({account.username})
              </button>
            )}
          </nav>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/"        element={<ProtectedRoute><Today    /></ProtectedRoute>} />
          <Route path="/refills" element={<ProtectedRoute><Refills  /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History  /></ProtectedRoute>} />
          <Route path="/settings"element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
