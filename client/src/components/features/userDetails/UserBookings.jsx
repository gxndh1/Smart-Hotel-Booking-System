import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../redux/authSlice";
import {
  FaCalendarAlt, FaHotel, FaDoorOpen, FaClock, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaMoneyBillWave, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaStar, FaSpinner, FaInfoCircle, FaExclamationTriangle, FaChevronRight, FaHistory
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5600';

const UserBookings = ({ bookings: propBookings, loading: propLoading, onBookingCancelled }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [bookings, setBookings] = useState(propBookings || []);
  const [loading, setLoading] = useState(propLoading || false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeFilter, setActiveTab] = useState('upcoming'); // upcoming, past, cancelled, all

  useEffect(() => {
    setBookings(propBookings || []);
  }, [propBookings]);

  useEffect(() => {
    setLoading(propLoading);
  }, [propLoading]);

  const getBookingStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "confirmed" || s === "completed") {
      return (
        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill border border-success border-opacity-25">
          <FaCheckCircle className="me-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    } else if (s === "cancelled") {
      return (
        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-2 rounded-pill border border-danger border-opacity-25">
          <FaTimesCircle className="me-1" />
          Cancelled
        </span>
      );
    } else {
      return (
        <span className="badge bg-warning bg-opacity-10 text-warning fw-bold px-3 py-2 rounded-pill border border-warning border-opacity-25">
          <FaHourglassHalf className="me-1" />
          Pending
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const canCancelBooking = (booking) => {
    if (!booking || booking.status?.toLowerCase() === 'cancelled') return false;
    const checkInDate = new Date(booking.checkInDate);
    const currentDate = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return (checkInDate.getTime() - currentDate.getTime() >= oneDayInMs) && booking.status?.toLowerCase() !== 'cancelled';
  };

  const handleViewDetails = async (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    setDetailsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings/${booking._id}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Handle 401 - session expired
      if (response.status === 401) {
        console.error("Unauthorized - session expired");
        dispatch(logout());
        navigate("/login", { state: { message: "Session expired. Please login again." } });
        return;
      }

      const data = await response.json();

      if (data.success) {
        setBookingDetails(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading booking details:", error);
      alert("Could not load full details. Showing basic information.");
      setBookingDetails({ ...booking, hotel: { name: booking.hotelName }, room: { type: booking.roomType } });
    }
    setDetailsLoading(false);
  };

  const handleModifyClick = () => {
    alert("Modification feature is coming soon! Please contact support for immediate changes.");
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    setCancelLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bookings/${selectedBooking._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Handle 401 - session expired
      if (response.status === 401) {
        console.error("Unauthorized - session expired");
        dispatch(logout());
        navigate("/login", { state: { message: "Session expired. Please login again." } });
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Update bookings list
        const updatedBookings = bookings.map(b =>
          b._id === selectedBooking._id
            ? { ...b, status: 'cancelled' }
            : b
        );
        setBookings(updatedBookings);

        // Close modal
        setShowCancelModal(false);
        setSelectedBooking(null);

        // If there's a callback, call it
        if (onBookingCancelled) {
          onBookingCancelled(selectedBooking._id);
        }

        alert('Booking cancelled successfully!');
        if (showDetailsModal) setShowDetailsModal(false);
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert('Error cancelling booking. Please try again.');
    }
    setCancelLoading(false);
  };

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkInDate);
      const status = booking.status?.toLowerCase();

      if (activeFilter === 'upcoming') return checkIn >= now && status !== 'cancelled';
      if (activeFilter === 'past') return checkIn < now && status !== 'cancelled';
      if (activeFilter === 'cancelled') return status === 'cancelled';
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.checkInDate || 0);
      const dateB = new Date(b.checkInDate || 0);
      return dateB - dateA;
    });
  }, [bookings, activeFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter(b => new Date(b.checkInDate) >= new Date() && b.status !== 'cancelled').length
  }), [bookings]);

  return (
    <>
      <div className="animate__animated animate__fadeIn">
        {/* Dashboard Header Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="opacity-75 mb-1">Upcoming Trips</h6>
                  <h2 className="fw-bold mb-0">{stats.upcoming}</h2>
                </div>
                <FaCalendarAlt size={40} className="opacity-25" />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Reservations</h6>
                  <h2 className="fw-bold mb-0 text-dark">{stats.total}</h2>
                </div>
                <FaHistory size={40} className="text-light" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
          {['upcoming', 'past', 'cancelled', 'all'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn rounded-pill px-4 py-2 fw-bold text-capitalize transition-all ${activeFilter === tab ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2].map(i => (
              <div key={i} className="col-12 card border-0 shadow-sm rounded-4 p-4 placeholder-glow">
                <div className="placeholder col-4 mb-3 py-3 rounded"></div>
                <div className="placeholder col-8 mb-2"></div>
                <div className="placeholder col-6"></div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="row g-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="col-12">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden hover-card bg-white">
                  <div className="row g-0">
                    <div className="col-md-3">
                      <div className="position-relative h-100" style={{ minHeight: '180px' }}>
                        <img
                          src={booking.roomId?.hotelId?.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"}
                          className="w-100 h-100 object-fit-cover"
                          alt="Hotel"
                        />
                        <div className="position-absolute top-0 start-0 m-3">
                          {getBookingStatusBadge(booking.status)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-9 p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 className="fw-bold text-dark mb-1">{booking.hotelName || booking.roomId?.hotelId?.name || "Luxury Stay"}</h4>
                          <p className="text-muted small mb-0 d-flex align-items-center gap-2">
                            <FaMapMarkerAlt className="text-primary" /> {booking.roomId?.hotelId?.location || "Premium Location"}
                          </p>
                        </div>
                        <div className="text-end">
                          <span className="text-muted xsmall d-block mb-1">BOOKING ID</span>
                          <code className="fw-bold text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                            #{booking._id.toString().slice(-8).toUpperCase()}
                          </code>
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light p-2 rounded-3"><FaDoorOpen className="text-muted" /></div>
                            <div>
                              <small className="text-muted d-block">Room Type</small>
                              <span className="fw-bold small">{booking.roomType || booking.roomId?.type || "Standard"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light p-2 rounded-3"><FaCalendarAlt className="text-muted" /></div>
                            <div>
                              <small className="text-muted d-block">Check-in</small>
                              <span className="fw-bold small">{formatDate(booking.checkInDate)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light p-2 rounded-3"><FaClock className="text-muted" /></div>
                            <div>
                              <small className="text-muted d-block">Duration</small>
                              <span className="fw-bold small">{booking.numberOfRooms} Room(s)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                        <div className="d-flex gap-2">
                          <button onClick={() => handleViewDetails(booking)} className="btn btn-primary rounded-pill px-4 btn-sm fw-bold">
                            View Details
                          </button>
                          {canCancelBooking(booking) && (
                            <>
                              <button onClick={handleModifyClick} className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold">
                                Modify
                              </button>
                              <button onClick={() => handleCancelClick(booking)} className="btn btn-link text-danger text-decoration-none btn-sm fw-bold">
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-end">
                          <span className="h5 fw-bold text-dark mb-0">₹{booking.totalPrice?.toLocaleString() || "---"}</span>
                          <small className="text-muted d-block xsmall">Total Paid</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
            <div className="display-1 text-light mb-4">🧳</div>
            <h3 className="fw-bold text-dark">No {activeFilter} bookings</h3>
            <p className="text-muted mb-4">Ready for your next adventure? Explore our top-rated hotels.</p>
            <Link to="/hotelList" className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm">
              Find a Hotel
            </Link>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <FaHotel className="me-2" />
                  Booking Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                {detailsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : bookingDetails ? (
                  <div className="row g-3">
                    {/* Booking Status */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Booking ID:</span>
                        <span className="fw-bold">{(bookingDetails._id || bookingDetails.bookingId)?.toString().slice(-8).toUpperCase() || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="text-muted">Status:</span>
                        {getBookingStatusBadge(bookingDetails.status)}
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="col-12 border-top pt-3">
                      <h6 className="fw-bold mb-3">Hotel Information</h6>
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <FaHotel className="text-primary me-2" />
                            <span className="fw-bold">{bookingDetails.hotel?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="text-muted me-2" />
                            <span className="text-muted">
                              {bookingDetails.hotel?.location || 'N/A'}
                              {bookingDetails.hotel?.address && `, ${bookingDetails.hotel.address}`}
                            </span>
                          </div>
                        </div>
                        {bookingDetails.hotel?.rating && (
                          <div className="col-12">
                            <div className="d-flex align-items-center">
                              <FaStar className="text-warning me-2" />
                              <span>{bookingDetails.hotel.rating} / 5</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="col-12 border-top pt-3">
                      <h6 className="fw-bold mb-3">Room Information</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaDoorOpen className="text-primary me-2" />
                            <span>Room Type: <strong>{bookingDetails.room?.type || 'N/A'}</strong></span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <span>Number of Rooms: <strong>{bookingDetails.numberOfRooms}</strong></span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <span>Price per Night: <strong>${bookingDetails.room?.price || 0}</strong></span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <span>Total Nights: <strong>{bookingDetails.totalNights || 0}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Dates */}
                    <div className="col-12 border-top pt-3">
                      <h6 className="fw-bold mb-3">Booking Dates</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="text-success me-2" />
                            <span>Check-in: <strong>{formatDate(bookingDetails.checkInDate)}</strong></span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="text-danger me-2" />
                            <span>Check-out: <strong>{formatDate(bookingDetails.checkOutDate)}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest Info */}
                    <div className="col-12 border-top pt-3">
                      <h6 className="fw-bold mb-3">Guest Information</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaUser className="text-primary me-2" />
                            <span>Name: <strong>{bookingDetails.user?.name || 'N/A'}</strong></span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaPhone className="text-muted me-2" />
                            <span>Phone: <strong>{bookingDetails.user?.phone || 'N/A'}</strong></span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <FaEnvelope className="text-muted me-2" />
                            <span>Email: <strong>{bookingDetails.user?.email || 'N/A'}</strong></span>
                          </div>
                        </div>
                        {bookingDetails.additionalGuests && bookingDetails.additionalGuests.length > 0 && (
                          <div className="col-12 mt-3 p-3 bg-light rounded-3">
                            <span className="text-muted small fw-bold d-block mb-2">Additional Guests</span>
                            <div className="d-flex flex-wrap gap-2">
                              {bookingDetails.additionalGuests.map((guest, idx) => (
                                <span key={idx} className="badge bg-white text-dark shadow-sm border px-3 py-2 d-flex align-items-center gap-2">
                                  <FaUser className="text-primary xsmall" /> {guest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Info */}
                    {bookingDetails.payment && (
                      <div className="col-12 border-top pt-3">
                        <h6 className="fw-bold mb-3">Payment Information</h6>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <FaMoneyBillWave className="text-success me-2" />
                              <span>Method: <strong>{bookingDetails.payment.method || 'N/A'}</strong></span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <span>Amount: <strong>${bookingDetails.payment.amount || bookingDetails.totalPrice || 0}</strong></span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <span>Status: </span>
                              <span className={`badge ms-2 ${bookingDetails.payment.status === 'success' ? 'bg-success' : 'bg-warning'}`}>
                                {bookingDetails.payment.status || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Price */}
                    <div className="col-12 border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 mb-0">Total Price:</span>
                        <span className="h4 mb-0 text-primary fw-bold">
                          ${bookingDetails.totalPrice || (bookingDetails.room?.price * bookingDetails.totalNights * bookingDetails.numberOfRooms) || 0}
                        </span>
                      </div>
                    </div>

                    {/* Cancel Info */}
                    {bookingDetails.canCancel === false && bookingDetails.status?.toLowerCase() !== 'cancelled' && (
                      <div className="col-12">
                        <div className="alert alert-warning d-flex align-items-center">
                          <FaExclamationTriangle className="me-2" />
                          This booking cannot be cancelled as it's less than 24 hours until check-in.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted">No details available</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
                {bookingDetails?.canCancel && bookingDetails.status?.toLowerCase() !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleCancelClick(selectedBooking);
                    }}
                  >
                    <FaTimesCircle className="me-2" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <FaExclamationTriangle className="me-2" />
                  Confirm Cancellation
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this booking?</p>
                <div className="bg-light p-3 rounded-3">
                  <p className="mb-1"><strong>Hotel:</strong> {selectedBooking?.hotelName || selectedBooking?.hotel}</p>
                  <p className="mb-1"><strong>Check-in:</strong> {formatDate(selectedBooking?.checkInDate)}</p>
                  <p className="mb-0"><strong>Check-out:</strong> {formatDate(selectedBooking?.checkOutDate)}</p>
                </div>
                <div className="alert alert-warning mt-3 mb-0">
                  <FaExclamationTriangle className="me-2" />
                  Cancellations must be made at least 1 day before check-in date.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                >
                  No, Keep Booking
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <>
                      <FaSpinner className="me-2 spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="me-2" />
                      Yes, Cancel Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserBookings;
