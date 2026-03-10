import React, { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import RoomList from "../components/features/hotel/RoomList";
import ReviewSection from "../components/features/hotelList/ReviewSection";
import { FaMapMarkerAlt, FaStar, FaShareAlt, FaHeart, FaCheckCircle, FaShieldAlt, FaAward } from "react-icons/fa";
// Redux Actions & Selectors
import { addToRecentVisits } from "../redux/userSlice";
import { fetchHotelById, clearSelectedHotel } from "../redux/hotelSlice";
import { selectRoomsByHotel, fetchRoomsByHotel } from "../redux/roomSlice";

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Redux State
  // FIX: Use granular selectors to prevent unnecessary re-renders when other parts of the hotels slice change
  const hotel = useSelector((state) => state.hotels.selectedHotel);
  const { user } = useSelector((state) => state.auth);
  const role = (user?.role || user?.Role || 'guest').toLowerCase();
  const hotelLoading = useSelector((state) => state.hotels.loading);
  const hotelError = useSelector((state) => state.hotels.error);
  const roomsByHotel = useSelector((state) => selectRoomsByHotel(state, id));
  const roomsLoading = useSelector((state) => state.rooms.loading);

  // Calculate total available rooms across all types
  const availableRoomsCount = useMemo(() => {
    return roomsByHotel.filter(r => (r.availability ?? r.Availability) === true).length;
  }, [roomsByHotel]);

  // Calculate minimum room price
  const minRoomPrice = useMemo(() => {
    if (!roomsByHotel || roomsByHotel.length === 0) return hotel?.minPrice || 0;
    const prices = roomsByHotel.map(room => room.price);
    return Math.min(...prices);
  }, [roomsByHotel, hotel]);

  // 2. Fetch Data on Mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      dispatch(fetchHotelById(id));
      dispatch(fetchRoomsByHotel(id));
    }
    return () => dispatch(clearSelectedHotel());
  }, [dispatch, id]);

  useEffect(() => {
    if (hotel) {
      dispatch(addToRecentVisits(hotel));
    }
  }, [hotel, dispatch]);

  const handleQuickBook = () => {
    // Check if any room is actually available
    const roomsWithAvailability = roomsByHotel.filter(r => r.availability === true);

    if (roomsWithAvailability.length > 0) {
      // Scroll to the Room Selection Section
      const roomsSection = document.getElementById('rooms');
      if (roomsSection) {
        roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Show toast message that no rooms are available
      const toast = document.createElement('div');
      toast.className = 'position-fixed bottom-0 start-50 translate-middle-x mb-3 p-3 bg-danger text-white rounded-3 shadow-lg';
      toast.innerHTML = '❌ Sorry, no rooms are currently available. Please try different dates.';
      toast.style.zIndex = '9999';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const handleShareProperty = () => {
    // Show toast message that feature is unavailable
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 start-50 translate-middle-x mb-3 p-3 bg-warning text-dark rounded-3 shadow-lg';
    toast.innerHTML = '⚠️ Share property feature is currently unavailable. Thank you for your interest!';
    toast.style.zIndex = '9999';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Loading & Error States
  if (hotelLoading) return (
    <div className="vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  if (hotelError || !hotel) return (
    <div className="text-center mt-5 py-5 min-vh-100">
      <h3 className="text-danger">{hotelError || "Hotel not found."}</h3>
      <Link to="/hotelList" className="btn btn-dark mt-3 rounded-pill">Back to Listings</Link>
    </div>
  );

  return (
    <div className="bg-white min-vh-100 d-flex flex-column">
      <NavBar />

      <main className="flex-grow-1">
        {/* Hero Section */}
        <section className="position-relative mb-5" style={{ height: "60vh", minHeight: "400px" }}>
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-100 h-100 object-fit-cover"
          />
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)" }}></div>

          <div className="position-absolute bottom-0 start-0 w-100 p-4 p-md-5 text-white">
            <div className="container">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">
                  <FaAward className="me-1" /> {hotel.tag || "Top Rated"}
                </span>
                <div className="d-flex text-warning">
                  {[...Array(5)].map((_, i) => <FaStar key={i} size={14} className={i < (hotel.rating > 0 ? (hotel.stars || 4) : 0) ? "" : "opacity-25"} />)}
                </div>
              </div>
              <h1 className="display-4 fw-bold mb-2">{hotel.name}</h1>
              <p className="fs-5 mb-0 d-flex align-items-center gap-2 opacity-90">
                <FaMapMarkerAlt /> {hotel.location}
              </p>
            </div>
          </div>

          <div className="position-absolute top-0 end-0 p-4 d-flex gap-2">
            <button onClick={handleShareProperty} className="btn btn-white btn-sm rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "white" }}>
              <FaShareAlt />
            </button>
            <button className="btn btn-white btn-sm rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", backgroundColor: "white" }}>
              <FaHeart className="text-danger" />
            </button>
          </div>
        </section>

        <div className="container">
          <div className="row g-5">
            {/* Left Column: Content */}
            <div className="col-lg-8">
              {/* Property Highlights */}
              <div className="row g-4 mb-5">
                <div className="col-md-4">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-primary fs-3"><FaCheckCircle /></div>
                    <div>
                      <h6 className="fw-bold mb-1">Self check-in</h6>
                      <p className="text-muted small mb-0">Check yourself in with the smart lock.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-primary fs-3"><FaMapMarkerAlt /></div>
                    <div>
                      <h6 className="fw-bold mb-1">Great location</h6>
                      <p className="text-muted small mb-0">95% of recent guests gave the location a 5-star rating.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-primary fs-3"><FaShieldAlt /></div>
                    <div>
                      <h6 className="fw-bold mb-1">Free cancellation</h6>
                      <p className="text-muted small mb-0">Flexible booking for your peace of mind.</p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-5 opacity-10" />

              {/* Description */}
              <section className="mb-5">
                <h4 className="fw-bold mb-4">About this property</h4>
                <p className="text-secondary lh-lg" style={{ fontSize: "1.1rem" }}>
                  {hotel.description || "Experience unparalleled luxury and comfort at this premier destination. Located in the heart of the city, our property offers world-class amenities, breathtaking views, and exceptional service tailored to make your stay unforgettable."}
                </p>
              </section>

              {/* Amenities Grid */}
              <section className="mb-5">
                <h4 className="fw-bold mb-4">What this place offers</h4>
                <div className="row g-3">
                  {(hotel.amenities || []).map((amenity, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="d-flex align-items-center gap-3 p-3 rounded-3 border bg-light bg-opacity-50">
                        <FaCheckCircle className="text-success" />
                        <span className="fw-medium">{amenity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Room Selection */}
              <section id="rooms" className="pt-5 border-top">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h3 className="fw-bold mb-0">Available Room Types</h3>
                  {!roomsLoading && (
                    <span className="badge bg-dark px-3 py-2 rounded-pill">{availableRoomsCount} rooms left</span>
                  )}
                </div>

                {roomsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : roomsByHotel.length > 0 ? (
                  <RoomList rooms={roomsByHotel} hotelId={hotel._id} />
                ) : (
                  <div className="alert alert-warning rounded-4 p-4">No rooms available for these dates.</div>
                )}
              </section>
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-lg rounded-4 sticky-top overflow-hidden" style={{ top: "100px", zIndex: 10 }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <span className="h3 fw-bold mb-0">₹{minRoomPrice > 0 ? minRoomPrice.toLocaleString() : "---"}</span>
                      <span className="text-muted ms-1">/ night</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold small">
                        {hotel.rating > 0 ? (
                          <>{hotel.rating} <FaStar className="text-warning mb-1" /></>
                        ) : (
                          "No ratings yet"
                        )}
                      </div>
                      <div className="text-muted xsmall text-decoration-underline">{hotel.reviewsCount || 0} reviews</div>
                    </div>
                  </div>

                  <button
                    onClick={handleQuickBook}
                    className="btn btn-primary w-100 py-3 fw-bold rounded-3 mb-3 shadow-sm"
                    disabled={role !== 'guest'}
                  >
                    {role !== 'guest' ? 'Booking Restricted' : 'Check Availability'}
                  </button>

                  <p className="text-center text-muted small mb-4">You won't be charged yet</p>

                  <div className="bg-light rounded-3 p-3 mb-0">
                    <div className="d-flex align-items-center gap-2 text-dark small fw-bold mb-2">
                      <FaShieldAlt className="text-success" /> Best Price Guarantee
                    </div>
                    <p className="text-muted xsmall mb-0">Find a lower price elsewhere and we'll match it plus give you 500 loyalty points.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-5 pt-5 border-top">
            <ReviewSection hotelId={hotel._id} hotelName={hotel.name} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HotelDetails;