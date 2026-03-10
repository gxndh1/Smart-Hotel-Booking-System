import React, { useState } from 'react';
import UserManagementTable from './UserManagementTable';
import { FaSearch } from 'react-icons/fa';

const AdminUserSection = ({ title, users, type, onDelete, onRoleChange }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h4 className="fw-bold mb-0">{title} ({filteredUsers.length})</h4>
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text bg-white border-end-0">
            <FaSearch className="text-muted" />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 ps-0" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <UserManagementTable
        users={filteredUsers}
        type={type}
        onDelete={onDelete}
        onRoleChange={onRoleChange}
      />
    </>
  );
};

export default AdminUserSection;