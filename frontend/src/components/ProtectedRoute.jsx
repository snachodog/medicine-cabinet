// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
