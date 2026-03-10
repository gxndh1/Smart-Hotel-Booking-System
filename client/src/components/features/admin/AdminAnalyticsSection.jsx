import React from 'react';
import { FaHotel, FaCalendarCheck } from 'react-icons/fa';

const AdminAnalyticsSection = ({ hotels = [] }) => {
  if (hotels.length === 0) {
    return <div className="text-center py-5 text-muted">No analytics data available.</div>;
  }

  return (
    <div className="analytics-section">
      <h5 className="fw-bold mb-4">Most Booked Hotels</h5>
      <div className="row g-4">
        {hotels.map((hotel, index) => (
          <div key={hotel._id || index} className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <div className="position-relative" style={{ height: '160px' }}>
                <img 
                  src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                  alt={hotel.name} 
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute top-0 start-0 m-3">
                  <span className="badge bg-primary rounded-pill px-3">#{index + 1}</span>
                </div>
              </div>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-1">{hotel.name}</h6>
                <p className="text-muted small mb-3">{hotel.location}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2 text-primary">
                    <FaCalendarCheck />
                    <span className="fw-bold">{hotel.bookingCount || 0}</span>
                    <span className="small text-muted">Bookings</span>
                  </div>
                  <div className="text-warning">
                    <FaHotel /> <span className="small text-muted">{hotel.totalRoomsCount || 0} Rooms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalyticsSection;