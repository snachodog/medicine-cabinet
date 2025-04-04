// frontend/src/pages/Users.jsx
// ----------------------------
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Users() {
  const [users, setUsers] = useState([]);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    allergies: '',
    medical_conditions: '',
    emergency_contact: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get('http://localhost:8085/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8085/users', form)
      .then(() => {
        fetchUsers();
        setForm({ name: '', email: '', allergies: '', medical_conditions: '', emergency_contact: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Users</h2>
      {success && <div className="text-green-600 font-semibold">User added successfully!</div>}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="block w-full p-2 border rounded" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="block w-full p-2 border rounded" />
        <input name="allergies" value={form.allergies} onChange={handleChange} placeholder="Allergies" className="block w-full p-2 border rounded" />
        <input name="medical_conditions" value={form.medical_conditions} onChange={handleChange} placeholder="Medical Conditions" className="block w-full p-2 border rounded" />
        <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Emergency Contact" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add User</button>
      </form>

      <ul className="list-disc pl-5">
        {users.map(user => (
          <li key={user.id}>
            {user.name} {user.email && `(${user.email})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Users;