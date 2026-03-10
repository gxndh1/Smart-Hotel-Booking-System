import React from 'react';
import { FaCheck, FaTimes, FaUser, FaCalendarAlt, FaBed } from 'react-icons/fa';

const ManagerBookingTable = ({ bookings = [], onApprove, onReject }) => {
  if (bookings.length === 0) {
    return <div className="text-center py-5 text-muted">No bookings found for your hotels.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th className="ps-4">Guest</th>
            <th>Hotel & Room</th>
            <th>Dates</th>
            <th>Status</th>
            <th className="text-end pe-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(booking => (
            <tr key={booking._id}>
              <td className="ps-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-light p-2 rounded-circle"><FaUser className="text-secondary"/></div>
                  <div>
                    <div className="fw-bold">{booking.userName}</div>
                    <div className="small text-muted">{booking.userEmail}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="fw-bold">{booking.hotelName}</div>
                <div className="small text-muted"><FaBed className="me-1"/> {booking.roomType}</div>
              </td>
              <td>
                <div className="small"><FaCalendarAlt className="me-1 text-primary"/> {new Date(booking.checkInDate).toLocaleDateString()}</div>
                <div className="small text-muted">to {new Date(booking.checkOutDate).toLocaleDateString()}</div>
              </td>
              <td>
                <span className={`badge rounded-pill px-3 py-2 ${
                  booking.status === 'confirmed' ? 'bg-success-subtle text-success' :
                  booking.status === 'pending' ? 'bg-warning-subtle text-warning' :
                  booking.status === 'cancelled' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'
                }`}>
                  {booking.status?.toUpperCase()}
                </span>
              </td>
              <td className="text-end pe-4">
                <div className="btn-group btn-group-sm">
                  {booking.status === 'pending' && (
                    <>
                      <button 
                        className="btn btn-outline-success" 
                        onClick={() => onApprove(booking._id)}
                        title="Approve Booking"
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => onReject(booking._id)}
                        title="Reject Booking"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  {booking.status !== 'pending' && (
                    <span className="text-muted small italic">No actions available</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManagerBookingTable;