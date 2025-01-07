import React, { useState } from 'react';
import './UserTable.css';

const initialUsers = [
  { id: 1, name: 'Smith', firstname: 'John' },
  { id: 2, name: 'Johnson', firstname: 'Emma' },
  { id: 3, name: 'Williams', firstname: 'Michael' },
  { id: 4, name: 'Brown', firstname: 'Olivia' },
  { id: 5, name: 'Jones', firstname: 'William' },
  { id: 6, name: 'Garcia', firstname: 'Sofia' },
  { id: 7, name: 'Miller', firstname: 'James' },
  { id: 8, name: 'Davis', firstname: 'Isabella' },
  { id: 9, name: 'Rodriguez', firstname: 'Alexander' },
  { id: 10, name: 'Martinez', firstname: 'Mia' }
];

const UserTable = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({
    firstname: '',
    name: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUser.firstname && newUser.name) {
      const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      setUsers(prev => [...prev, { ...newUser, id: newUserId }]);
      setNewUser({ firstname: '', name: '' }); // Reset form
    }
  };

  return (
    <div className="user-table-container">
      <h2>User List</h2>
      
      <form className="user-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          value={newUser.firstname}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Last Name"
          value={newUser.name}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Add User</button>
      </form>

      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstname}</td>
              <td>{user.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
