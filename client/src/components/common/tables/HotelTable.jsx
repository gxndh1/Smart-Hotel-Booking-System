import React, { useState } from 'react';
import { FaTrash, FaEdit, FaStar, FaBed, FaEye, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HotelTable = ({ hotels = [], onDelete, isAdmin, isManager }) => {
  const navigate = useNavigate();
  const [expandedHotel, setExpandedHotel] = useState(null);

  // Helpers to handle inconsistent data models (Name vs name, etc.)
  const getId = (hotel) => hotel._id || hotel.id || '';
  const getName = (hotel) => hotel.name || hotel.Name || '';
  const getLocation = (hotel) => hotel.location || hotel.Location || '';
  const getImage = (hotel) => hotel.image || hotel.Image || '';
  const getRating = (hotel) => hotel.rating || hotel.Rating || 0;
  const getManager = (hotel) => hotel.managerId || hotel.manager || null;

  const handleEdit = (hotel) => {
    navigate('/add-hotel', { state: { editHotel: hotel, isEditing: true } });
  };

  const toggleExpand = (hotelId) => {
    setExpandedHotel(expandedHotel === hotelId ? null : hotelId);
  };

  if (hotels.length === 0) {
    return (
      <div className="text-center py-5 text-muted bg-white rounded-4 border">
        <i className="bi bi-building-x fs-1 d-block mb-2 opacity-50"></i>
        No hotels found in the directory.
      </div>
    );
  }

  return (
    <div className="table-responsive shadow-sm rounded-4 overflow-hidden">
      <table className="table table-hover align-middle mb-0 bg-white">
        <thead className="table-light">
          <tr>
            <th className="ps-4">Preview</th>
            <th>Hotel Name</th>
            <th>Location</th>
            {isAdmin && <th>Manager</th>}
            <th>Rating</th>
            {isAdmin && <th>Stats</th>}
            <th className="text-end pe-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map(hotel => {
            const hotelId = getId(hotel);
            return (
              <React.Fragment key={hotelId}>
                <tr className={expandedHotel === hotelId ? 'table-primary table-opacity-10' : ''}>
                  <td className="ps-4">
                    <img
                      src={getImage(hotel)}
                      alt={getName(hotel)}
                      width="60"
                      height="40"
                      className="rounded shadow-sm object-fit-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'; }}
                    />
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{getName(hotel)}</div>
                    <div className="small text-muted">ID: #{hotelId.slice(-6).toUpperCase()}</div>
                  </td>
                  <td>
                    <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                      📍 {getLocation(hotel)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {getManager(hotel) ? (
                        <div className="small">
                          <div className="fw-bold"><FaUserTie className="me-1 text-primary" />{getManager(hotel).name || 'Manager'}</div>
                          <div className="text-muted">{getManager(hotel).email}</div>
                        </div>
                      ) : <span className="badge bg-secondary">Unassigned</span>}
                    </td>
                  )}
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <FaStar className="text-warning" />
                      <span className="fw-bold">{getRating(hotel).toFixed(1)}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="d-flex gap-1">
                        <span className="badge bg-info-subtle text-info border border-info-subtle">{hotel.totalRoomsCount || 0} Rooms</span>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">{hotel.bookingCount || 0} Bookings</span>
                      </div>
                    </td>
                  )}
                  <td className="text-end pe-4">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => toggleExpand(hotelId)} title="View Details">
                        <FaEye />
                      </button>
                      {isManager && (
                        <button className="btn btn-outline-primary" onClick={() => handleEdit(hotel)} title="Edit Hotel">
                          <FaEdit />
                        </button>
                      )}
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => window.confirm(`Delete ${getName(hotel)}?`) && onDelete(hotelId)}
                        title="Delete Hotel"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedHotel === hotelId && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="p-0 border-0">
                      <div className="bg-light p-4 animate__animated animate__fadeIn">
                        <div className="card border-0 shadow-sm rounded-3">
                          <div className="card-body">
                            <h6 className="fw-bold mb-3">Property Overview</h6>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <p className="mb-1 small"><strong>Description:</strong> {hotel.description || 'No description provided.'}</p>
                                <p className="mb-1 small"><strong>Tag:</strong> <span className="badge bg-primary">{hotel.tag || 'Standard'}</span></p>
                              </div>
                              <div className="col-md-6">
                                <p className="mb-1 small"><strong>Amenities:</strong></p>
                                <div className="d-flex flex-wrap gap-1">
                                  {(hotel.amenities || hotel.Amenities || []).map((a, i) => (
                                    <span key={i} className="badge bg-secondary-subtle text-secondary border border-secondary-subtle small">{a}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HotelTable;