// frontend/src/App.jsx
// TODO: Add a Dashboard page as the default route showing expiring-soon prescriptions,
// low-stock consumables, and recent activity. Add a /dashboard route and nav link.
// TODO: Add route-level authentication guards. Redirect unauthenticated users to /login.
// All routes except /login should require a valid session.
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Users from './pages/Users';
import Medications from './pages/Medications';
import Prescriptions from './pages/Prescriptions';
import Consumables from './pages/Consumables';

const NAV_LINKS = [
  { to: '/users', label: 'People' },
  { to: '/medications', label: 'Medications' },
  { to: '/prescriptions', label: 'Prescriptions' },
  { to: '/consumables', label: 'Consumables' },
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

function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            Medicine Cabinet
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => <NavLink key={l.to} {...l} />)}
          </nav>

          {/* Hamburger button — mobile only */}
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

        {/* Mobile nav dropdown */}
        {navOpen && (
          <nav className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} {...l} onClick={() => setNavOpen(false)} />
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/consumables" element={<Consumables />} />
          <Route path="/" element={
            <div className="text-gray-500">
              Select a section from the navigation above.
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
