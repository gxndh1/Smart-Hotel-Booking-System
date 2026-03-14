import React from 'react';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

const DashboardHeader = ({ title, subtitle, icon: Icon, onAccountClick, onLogoutClick }) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
      <div className="d-flex align-items-center gap-3">
        {Icon && (
          <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary shadow-sm">
            <Icon size={24} />
          </div>
        )}
        {/* HEADING */}
        <div>
          <h2 className="fw-bold mb-0 text-dark">{title}</h2>
          <p className="text-muted mb-0">{subtitle}</p>
        </div>
      </div>
      <div className="d-flex gap-2">
        {/* ACCOUNT */}
        <button 
          onClick={onAccountClick} 
          className="btn btn-white border shadow-sm rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
          style={{ backgroundColor: 'white' }}
        >
          <FaUser size={14} /> My Account
        </button>
        {/* LOGOUT */}
        <button 
          onClick={onLogoutClick} 
          className="btn btn-outline-danger rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
        >
          <FaSignOutAlt size={14} /> Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;