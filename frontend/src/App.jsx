// frontend/src/App.jsx
// --------------------
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Users from './pages/Users';
import Medications from './pages/Medications';
import Prescriptions from './pages/Prescriptions';
import Consumables from './pages/Consumables';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4">
      <header className="text-2xl font-bold mb-4">MediCabinet</header>
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
        <Route path="/" element={<div>Welcome to the MediCabinet frontend!</div>} />
      </Routes>
    </div>
  );
}

export default App;
