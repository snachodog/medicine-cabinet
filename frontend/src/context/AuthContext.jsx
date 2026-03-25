// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mc_token'));
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('mc_token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(r => setAccount(r.data))
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  function login(newToken) {
    localStorage.setItem('mc_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('mc_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ token, account, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
