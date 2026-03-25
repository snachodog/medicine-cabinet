// frontend/src/App.jsx
// --------------------
// TODO: Add a Dashboard page as the default route showing expiring-soon prescriptions,
// low-stock consumables, and recent activity. Add a /dashboard route and nav link.
// TODO: Make the layout mobile-responsive using Tailwind breakpoints. Replace the flat
// nav with a hamburger menu on small screens and add a sidebar for larger screens.
// TODO: Add route-level authentication guards. Redirect unauthenticated users to /login.
// All routes except /login should require a valid session.
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Users from './pages/Users';
import Medications from './pages/Medications';
import Prescriptions from './pages/Prescriptions';
import Consumables from './pages/Consumables';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4">
      <header className="text-2xl font-bold mb-4">Medicine Cabinet</header>
      <nav className="space-x-4 mb-4">
        <Link to="/users" className="text-blue-500 hover:underline">Users</Link>
        <Link to="/medications" className="text-blue-500 hover:underline">Medications</Link>
        <Link to="/prescriptions" className="text-blue-500 hover:underline">Prescriptions</Link>
        <Link to="/consumables" className="text-blue-500 hover:underline">Consumables</Link>
      </nav>
      <Routes>
        <Route path="/users" element={<Users />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/consumables" element={<Consumables />} />
        <Route path="/" element={<div>Welcome to the Medicine Cabinet frontend!</div>} />
      </Routes>
    </div>
  );
}

export default App;
