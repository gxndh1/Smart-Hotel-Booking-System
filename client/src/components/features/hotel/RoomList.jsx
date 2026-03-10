import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToRecentVisits } from '../../../redux/userSlice';
import { selectAllHotels } from '../../../redux/hotelSlice';

const RoomList = ({ rooms, hotelId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const allHotels = useSelector(selectAllHotels);

  const handleBooking = (room) => {
    try {
      const currentHotel = allHotels?.find(h => String(h._id) === String(hotelId));
      if (currentHotel) {
        dispatch(addToRecentVisits(currentHotel));
      }

      if (room?._id && hotelId) {
        navigate(`/booking/${hotelId}/${room._id}`);
      } else {
        throw new Error("Missing Room or Hotel ID");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      alert("We encountered an issue preparing your booking. Please try refreshing the page.");
    }
  };

  // Empty State
  if (!rooms || rooms.length === 0) {
    return (
      <div className="alert alert-info rounded-4 border-0 shadow-sm p-5 text-center">
        <i className="bi bi-info-circle fs-1 d-block mb-3 text-primary opacity-50"></i>
        <h5 className="fw-bold">No rooms available for online booking</h5>
        <p className="text-muted mb-0">Please contact the hotel directly to inquire about last-minute availability.</p>
      </div>
    );
  }

  // Group rooms by type
  const groupedRooms = useMemo(() => {
    const groups = {};
    rooms.forEach(room => {
      const type = room.type || room.Type || "Standard Room";
      const id = room._id || room.id;
      const isAvailable = String(room.availability ?? room.Availability).toLowerCase() === "true";

      if (!groups[type]) {
        groups[type] = {
          type,
          image: room.image,
          size: room.size || "Standard Size",
          features: room.features || room.Features || [],
          price: room.price ?? room.Price ?? 0,
          availableCount: 0,
          totalInventory: 0,
          availableRoomId: null,
          allIds: []
        };
      }

      if (isAvailable) {
        groups[type].availableCount++;
        if (!groups[type].availableRoomId) {
          groups[type].availableRoomId = id;
        }
      }

      groups[type].totalInventory += room.totalRooms || 1;
      groups[type].allIds.push(id);
    });
    return Object.values(groups);
  }, [rooms]);

  return (
    <div className="row g-4 animate__animated animate__fadeInUp">
      {groupedRooms.map((room, index) => {
        try {
          if (!room) return null;
          const isAvailable = room.availableCount > 0;

          return (
            <div key={room.availableRoomId || index} className="col-12 mb-4">
              <div className={`card border shadow-sm rounded-4 overflow-hidden transition-all ${isAvailable ? 'hover-shadow-lg' : 'opacity-75'}`}>
                <div className="row g-0">
                  {/* Image */}
                  <div className="col-md-4" style={{ minHeight: "220px", position: "relative", overflow: 'hidden' }}>
                    <img 
                      src={room.image || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"} 
                      alt={room.type} 
                      className="w-100 h-100 hotel-img-zoom" 
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"; }}
                    />
                    {!isAvailable && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                           style={{ background: "rgba(0,0,0,0.7)", color: "#fff", zIndex: 2 }}>
                        <span className="fw-bold text-uppercase border border-2 p-2 px-3 tracking-widest">Sold Out</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-md-8 card-body p-4 d-flex flex-column">
                    {/* Title & Status */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">{room.type}</h5>
                        <small className="text-muted">{room.size}</small>
                      </div>
                      <span className={`badge rounded-pill px-3 py-2 ${
                        room.availableCount > 2 ? 'bg-success-subtle text-success' : 
                        room.availableCount > 0 ? 'bg-warning-subtle text-warning' : 
                        'bg-light text-muted'
                      }`}>
                        {room.availableCount > 0 ? `${room.availableCount} Left` : "Sold Out"}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="mb-4 flex-grow-1">
                      <div className="row g-2">
                        {room.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="col-6">
                            <span className="text-muted small d-flex align-items-center">
                              <i className="bi bi-check2 text-primary me-2"></i>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between">
                      <div>
                        <span className="text-muted xsmall d-block" style={{ fontSize: '11px' }}>Per Night</span>
                        <h4 className="fw-bold text-dark mb-0">
                          ₹{room.price.toLocaleString()}
                        </h4>
                      </div>
                      <button 
                        onClick={() => handleBooking({ ...room, _id: room.availableRoomId })}
                        className={`btn ${isAvailable ? 'btn-primary' : 'btn-secondary disabled'} px-4 fw-bold rounded-pill shadow-sm transition-all`}
                        disabled={!isAvailable}
                      >
                        {isAvailable ? 'Book' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        } catch (itemError) {
          console.error("Card Render Error:", itemError);
          return null; 
        }
      })}
    </div>
  );
};

export default RoomList;
