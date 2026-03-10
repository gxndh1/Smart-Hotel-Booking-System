import React from 'react';
import { FaSearch } from 'react-icons/fa';

const DashboardSearch = ({ searchTerm, onSearchChange, placeholder }) => {
  return (
    <div className="mb-4">
      <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden border">
        <span className="input-group-text bg-white border-0 ps-4 text-muted">
          <FaSearch />
        </span>
        <input
          type="text"
          className="form-control border-0 shadow-none py-3"
          placeholder={placeholder || "Search..."}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default DashboardSearch;