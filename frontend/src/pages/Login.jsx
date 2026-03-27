// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState({ registration_enabled: true, oidc_enabled: false, oidc_provider_name: 'SSO' });

  useEffect(() => {
    // Check URL for OIDC error param
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oidc_denied') setError('SSO login was cancelled or denied.');
    if (params.get('error') === 'account_disabled') setError('Your account is disabled.');

    axios.get('/api/auth/config').then(r => {
      setConfig(r.data);
      // If register tab is open but registration just got disabled, switch to login
      if (!r.data.registration_enabled) setTab('login');
    }).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (tab === 'login') {
        const params = new URLSearchParams();
        params.append('username', form.username);
        params.append('password', form.password);
        const res = await axios.post('/api/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        login(res.data);
        navigate('/');
      } else {
        await axios.post('/api/auth/register', form);
        setTab('login');
        setError('Account created — please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = config.registration_enabled ? ['login', 'register'] : ['login'];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Medicine Cabinet</h1>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 pb-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <p className={`text-sm mb-4 ${error.startsWith('Account created') ? 'text-green-600' : 'text-red-500'}`}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            autoComplete="username"
            required
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            required
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {config.oidc_enabled && (
          <div className="mt-4">
            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 text-xs text-gray-400 dark:text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>
            <a
              href="/api/auth/oidc/login"
              className="flex items-center justify-center w-full py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign in with {config.oidc_provider_name}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
