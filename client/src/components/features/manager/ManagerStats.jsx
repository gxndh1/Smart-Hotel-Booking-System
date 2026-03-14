import React from 'react';
import { FaBuilding, FaBed, FaCalendarCheck, FaWallet } from 'react-icons/fa';


// CONVERTING VALUE IN LAKH
const formatRevenue = (amount) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${(amount || 0).toLocaleString()}`;
};


// MANAGER DASHBOARD STATS
const ManagerStats = ({ stats }) => {
  const dashboardStats = [
    { label: "My Hotels", value: stats?.hotels?.total || 0, color: "primary", icon: <FaBuilding /> },
    { label: "Total Rooms", value: stats?.hotels?.rooms || 0, color: "info", icon: <FaBed /> },
    { label: "Total Bookings", value: stats?.bookings?.total || 0, color: "success", icon: <FaCalendarCheck /> },
    { label: "Est. Revenue", value: formatRevenue(stats?.revenue?.total), color: "warning", icon: <FaWallet /> },
  ];


  // UI
  return (
    <div className="row g-3">
      {dashboardStats.map((stat, index) => (
        <div key={index} className="col-md-6 col-lg-3">
          <div className={`card border-0 shadow-sm rounded-4 bg-${stat.color} text-white h-100`}>
            <div className="card-body p-4 text-center">
              <div className="mb-2">{stat.icon}</div>
              <h3 className="fw-bold mb-1">{stat.value}</h3>
              <p className="mb-0 opacity-75 small">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManagerStats;