// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Always send cookies with API requests
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if an active session cookie exists
  useEffect(() => {
    axios.get('/api/auth/me')
      .then(r => setAccount(r.data))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, []);

  // Called after a successful POST /api/auth/login with the returned AccountResponse
  function login(accountData) {
    setAccount(accountData);
  }

  async function logout() {
    try {
      await axios.post('/api/auth/logout');
    } catch (_) {
      // Proceed even if the request fails — cookie cleared server-side regardless
    }
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ account, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
