import React from 'react';

const DashboardTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="nav nav-pills mb-4 bg-white p-2 rounded-4 shadow-sm d-inline-flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-bold transition-all ${
            activeTab === tab.id ? 'active shadow-sm' : 'text-muted'
          }`}
          style={{ border: 'none' }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;