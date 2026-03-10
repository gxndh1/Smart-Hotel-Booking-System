import React from 'react';
import { FaUsers, FaUserTie, FaHotel, FaStar, FaCheck, FaChartBar } from 'react-icons/fa';

const AdminStats = ({ stats }) => {
  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount || 0).toLocaleString()}`;
  };

  const dashboardStats = [
    { label: "Total Users", value: stats?.users?.total || 0, color: "primary", icon: <FaUsers /> },
    { label: "Guests", value: stats?.users?.guests || 0, color: "info", icon: <FaUserTie /> },
    { label: "Managers", value: stats?.users?.managers || 0, color: "warning", icon: <FaUserTie /> },
    { label: "Total Hotels", value: stats?.hotels?.total || 0, color: "success", icon: <FaHotel /> },
    { label: "Total Rooms", value: stats?.hotels?.rooms || 0, color: "secondary", icon: <FaHotel /> },
    { label: "Total Bookings", value: stats?.bookings?.total || 0, color: "primary", icon: <FaStar /> },
    { label: "Confirmed", value: stats?.bookings?.confirmed || 0, color: "success", icon: <FaCheck /> },
    { label: "Revenue", value: formatRevenue(stats?.revenue?.total), color: "warning", icon: <FaChartBar /> },
  ];

  return (
    <div className="row g-3">
      {dashboardStats.map((stat, idx) => (
        <div key={idx} className="col-md-6 col-lg-3">
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

export default AdminStats;