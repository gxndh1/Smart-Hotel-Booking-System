import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaUserFriends, FaCheck, FaBed } from 'react-icons/fa';

const RoomList = ({ rooms, hotelId }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = (user?.role || user?.Role || 'guest').toLowerCase();

  // Determine if a room is truly available based on the new counter
  const getAvailabilityStatus = (room) => {
    const roomsLeft = room.roomsLeft !== undefined ? room.roomsLeft : (room.totalRooms || 1);
    const isManuallyDisabled = room.availability === false || room.Availability === false;
    return {
      roomsLeft,
      isAvailable: !isManuallyDisabled && roomsLeft > 0
    };
  };

  return (
    <div className="row g-3">
      {rooms.map((room) => {
        const { roomsLeft, isAvailable } = getAvailabilityStatus(room);
        return (
          <div key={room._id} className="col-12">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeIn">
            <div className="row g-0">
              <div className="col-md-4">
                <img 
                  src={room.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'} 
                  className="w-100 h-100 object-fit-cover"
                  alt={room.type || room.Type}
                  style={{ minHeight: '200px' }}
                />
              </div>
              <div className="col-md-8 p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">{room.type || room.Type}</h5>
                    <div className="text-muted small d-flex align-items-center gap-2">
                      <FaBed /> {room.bedType || 'King Bed'}
                    </div>
                  </div>
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <FaUserFriends /> Up to {room.capacity || 2} guests
                  </span>
                </div>
                
                <div className="mb-2">
                  <span className={`badge ${roomsLeft > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border-0 px-3`}>
                    {roomsLeft > 0 ? `${roomsLeft} rooms remaining` : 'Sold Out'}
                  </span>
                </div>
                
                <div className="mb-3">
                  {(room.features || []).slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="text-success small d-inline-flex align-items-center gap-1 me-3">
                      <FaCheck size={10} /> {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="fw-bold mb-0 text-primary">₹{room.price?.toLocaleString()}</h4>
                    <span className="text-muted small">per night</span>
                  </div>
                  <button 
                    className={`btn ${isAvailable && role === 'guest' ? 'btn-dark' : 'btn-secondary'} rounded-pill px-4 py-2 fw-bold`}
                    onClick={() => navigate(`/booking/${hotelId}/${room._id}`)}
                    disabled={!isAvailable || role !== 'guest'}
                  >
                    {role !== 'guest' ? 'Guest Only' : isAvailable ? 'Book Now' : 'Sold Out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )})}
    </div>
  );
};

export default RoomList;