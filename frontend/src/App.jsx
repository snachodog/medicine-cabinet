import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function NavLink({ to, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`hover:text-blue-500 transition-colors ${active ? 'text-blue-500 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
    >
      {label}
    </Link>
  );
}

function AppShell() {
  const { account, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
            Medicine Cabinet
          </Link>

          <div className="flex items-center gap-4">
            {account && (
              <nav className="hidden md:flex items-center gap-6">
                {NAV_LINKS.map(l => <NavLink key={l.to} {...l} />)}
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                >
                  Sign out
                </button>
              </nav>
            )}

            <button
              onClick={() => setDark(d => !d)}
              className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {account && (
              <button
                className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setNavOpen(o => !o)}
                aria-label="Toggle navigation"
                aria-expanded={navOpen}
              >
                <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
                <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
                <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300" />
              </button>
            )}
          </div>
        </div>

        {account && navOpen && (
          <nav className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex flex-col gap-4">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} {...l} onClick={() => setNavOpen(false)} />
            ))}
            <button
              onClick={() => setDark(d => !d)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
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

      <footer className="max-w-3xl mx-auto px-4 py-4 mt-2 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
        <a
          href="https://github.com/snachodog/medicine-cabinet"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="View source on GitHub"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
        <a
          href={`https://github.com/snachodog/medicine-cabinet/commit/${__COMMIT_HASH__}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title="View this build's commit on GitHub"
        >
          {__COMMIT_HASH__}
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}
