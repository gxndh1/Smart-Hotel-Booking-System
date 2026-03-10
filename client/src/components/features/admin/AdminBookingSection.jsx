import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const STATUS_COLORS = {
  confirmed: "success",
  pending: "warning",
  cancelled: "danger",
  completed: "info",
};

const AdminBookingSection = ({ bookings, onApprove, onReject }) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>Booking ID</th>
            <th>Guest</th>
            <th>Hotel</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th className="text-end pe-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const statusColor = STATUS_COLORS[booking.status?.toLowerCase()] || "secondary";
            const displayId = (booking.bookingId || booking._id || '').toString().slice(-6).toUpperCase();

            return (
              <tr key={booking._id}>
                <td className="fw-bold">#{displayId}</td>
                <td>
                  <div className="fw-bold">{booking.userName}</div>
                  <div className="small text-muted">{booking.userEmail}</div>
                </td>
                <td>
                  <div className="fw-bold">{booking.hotelName}</div>
                  <div className="small text-muted">{booking.hotelLocation}</div>
                </td>
                <td>{booking.roomType}</td>
                <td className="small">
                  {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : "N/A"}
                </td>
                <td className="small">
                  {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : "N/A"}
                </td>
                <td>
                  <span className={`badge bg-${statusColor}`}>{booking.status}</span>
                </td>
                <td className="text-end pe-3">
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      className="btn btn-outline-success"
                      onClick={() => onApprove(booking._id)}
                      disabled={booking.status === "confirmed"}
                      title="Approve"
                    >
                      <FaCheck />
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => onReject(booking._id)}
                      disabled={booking.status === "cancelled"}
                      title="Reject"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookingSection;