import React from "react";
import { FaTrash, FaEdit, FaUserShield, FaUserTie, FaUser } from "react-icons/fa";

// Helper to safely get user data moved outside to prevent re-creation
const getId = (user) => user?._id || user?.id || user?.UserID || Math.random().toString(36).substr(2, 9);
const getName = (user) => user?.Name || user?.name || 'Unknown User';
const getEmail = (user) => user?.Email || user?.email || 'No Email';

const RoleBadge = ({ role }) => {
  const roles = {
    admin: { color: "danger", icon: <FaUserShield className="me-1" />, label: "Admin" },
    manager: { color: "warning", icon: <FaUserTie className="me-1" />, label: "Manager" },
    guest: { color: "info", icon: <FaUser className="me-1" />, label: "Guest" }
  };
  const config = roles[role?.toLowerCase()] || roles.guest;

  return (
    <span className={`badge bg-${config.color}-subtle text-${config.color} border border-${config.color}-subtle px-3 rounded-pill`}>
      {config.icon} {config.label}
    </span>
  );
};

const UserManagementTable = ({ users, type, onDelete, onRoleChange }) => {
  const handleRoleChange = (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      onRoleChange(userId, newRole);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle border-0">
        <thead className="table-light">
          <tr className="text-secondary small text-uppercase">
            <th className="py-3 px-4">ID</th>
            <th className="py-3">Name</th>
            <th className="py-3">Email</th>
            <th className="py-3">Role</th>
            {type === 'customer' && <th className="py-3">Bookings</th>}
            <th className="py-3">Joined</th>
            {type !== 'admin' && <th className="py-3 text-end px-4">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={getId(user)} className="border-bottom">
                <td className="px-4 fw-bold text-muted">#{getId(user).slice(-6)}</td>
                <td>
                  <div className="fw-bold">{getName(user)}</div>
                  <div className="small text-muted d-md-none">{getEmail(user)}</div>
                </td>
                <td className="text-muted d-none d-md-table-cell">{getEmail(user)}</td>
                <td>
                  <RoleBadge role={user.role || type} />
                </td>
                {type === 'customer' && (
                  <td>
                    <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill">
                      {user.bookingCount || 0}
                    </span>
                  </td>
                )}
                <td className="text-muted small">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </td>
                {type !== 'admin' && (
                  <td className="px-4">
                    <div className="d-flex gap-2 justify-content-end">
                      {/* Delete Button */}
                      <button
                        className="btn btn-sm btn-light border"
                        title="Delete User"
                        onClick={() => onDelete(getId(user))}
                      >
                        <FaTrash className="text-danger" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={type === 'customer' ? "7" : type === 'admin' ? "5" : "6"} 
                className="text-center py-5"
              >
                <div className="text-muted">
                  <i className="bi bi-person-x display-4 d-block mb-2"></i>
                  No {type}s found in the database.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementTable;