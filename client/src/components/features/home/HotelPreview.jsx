import React, { useEffect, useMemo } from "react";
import { FaCheck, FaStar, FaRegHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchHotels, selectAllHotels } from "../../../redux/hotelSlice";

function HotelPreview() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // FIX: Use specific selectors to prevent unnecessary re-renders when unrelated state (like filters or error) changes
  const allHotels = useSelector(selectAllHotels);
  const loading = useSelector((state) => state.hotels.loading);
  const error = useSelector((state) => state.hotels.error);

  // Dataflow: Fetch hotels on mount if list is empty
  useEffect(() => {
    // FIX: Added check for loading and error to prevent infinite re-fetching loops if the API fails or is already fetching
    if (allHotels.length === 0 && !loading && !error) {
      dispatch(fetchHotels());
    }
  }, [dispatch, allHotels.length, loading, error]);

  // UI Logic: Show top 4 rated hotels as "Featured" - Memoized to prevent unnecessary array creation on every render
  const featuredHotels = useMemo(() => {
    return [...allHotels]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [allHotels]);

  return (
    // Use a standard Bootstrap container to handle alignment automatically
    <div className="container-fluid px-3 px-md-5 mt-5 hotel-preview-wrapper">
      {/* Header Section: Aligned with the container edges */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">
          Featured stays guests love
        </h3>
        <Link
          to="/hotelList"
          className="btn btn-outline-dark fw-bold rounded-2 px-3 py-2"
          style={{ fontSize: "0.85rem" }}
        >
          See more deals →
        </Link>
      </div>

      {/* Grid Section: Using Bootstrap Row/Col for perfect alignment */}
      <div className="row g-3 justify-content-center">
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center">
              <div className="card border-0 rounded-4 shadow-sm w-100 h-100" style={{ maxWidth: "280px" }}>
                <div className="placeholder-glow rounded-top-4 overflow-hidden">
                  <div className="placeholder w-100" style={{ height: "220px" }}></div>
                </div>
                <div className="card-body d-flex flex-column p-3">
                  <h5 className="card-title placeholder-glow mb-1">
                    <span className="placeholder col-8"></span>
                  </h5>
                  <p className="card-text placeholder-glow small mb-3">
                    <span className="placeholder col-6"></span>
                  </p>
                  <div className="d-flex align-items-center gap-2 mb-3 placeholder-glow">
                    <span className="placeholder col-3 py-2 rounded-1"></span>
                    <span className="placeholder col-4 py-2"></span>
                  </div>
                  <div className="mt-auto border-top pt-3 placeholder-glow">
                    <div className="placeholder col-5 py-3"></div>
                  </div>
                  <div className="placeholder-glow mt-3">
                    <span className="placeholder col-12 py-3 rounded-3"></span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : featuredHotels.length > 0 ? (
          featuredHotels.map((hotel) => (
            <div
              key={hotel._id}
              className="col-12 col-sm-6 col-lg-3 d-flex justify-content-center"
            >
              <div
                className="card border-0 rounded-4 shadow-sm w-100 hotel-card h-100"
                style={{ 
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow = "0 20px 30px rgba(0,0,0,0.1)";
                  const img = e.currentTarget.querySelector('.card-img-top');
                  if (img) img.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
                  const img = e.currentTarget.querySelector('.card-img-top');
                  if (img) img.style.transform = "scale(1)";
                }}
              >
                <div className="position-relative overflow-hidden rounded-top-4">
                  <img
                    src={hotel.image}
                    className="card-img-top transition-all"
                    alt={hotel.name}
                    style={{ height: "220px", objectFit: "cover", transition: "transform 0.6s ease" }}
                    onError={(e) => { e.target.onError = null; e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"; }}
                  />
                  <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-2">
                    <span className="badge bg-dark text-white small fw-bold px-3 py-2 rounded-pill shadow-sm">Featured</span>
                    {hotel.availableRoomsCount === 0 && (
                      <span className="badge bg-danger text-white small fw-bold px-3 py-2 rounded-pill shadow-sm">Sold Out</span>
                    )}
                  </div>
                  <button className="btn btn-white btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px", backgroundColor: "white" }}>
                    <FaRegHeart className="text-danger" />
                  </button>
                </div>

                <div className="card-body d-flex flex-column p-3">
                  <h5 className="card-title fw-bold mb-1 fs-5 text-truncate">
                    {hotel.name}
                  </h5>
                  <p className="card-text text-muted small mb-3">
                    {hotel.location}
                  </p>

                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-success d-flex align-items-center gap-1 py-1 px-2 rounded-1">
                      {hotel.rating || "New"} <FaStar size={10} />
                    </span>
                    <span className="fw-bold small text-primary">{hotel.tag || "Highly Rated"}</span>
                    <span className="text-secondary small" style={{ fontSize: '12px' }}>
                      ({hotel.reviewsCount || 0})
                    </span>
                  </div>

                  {/* Price and Features Box */}
                  <div className="mt-auto border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-bold">Best Deal</span>
                      <div
                        className="text-success d-flex align-items-center gap-1"
                        style={{ fontSize: "12px" }}
                      >
                        <FaCheck size={10} />{" "}
                        {hotel.amenities?.[0] || "Verified"}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <h4 className="fw-bold mb-0 fs-4 text-dark">
                        {hotel.availableRoomsCount === 0 ? "N/A" : `₹${hotel.minPrice?.toLocaleString() || "3,000"}`}
                      </h4>
                      {hotel.availableRoomsCount !== 0 && (
                        <span
                        className="text-muted"
                        style={{ fontSize: "11px" }}
                      >
                        / night
                      </span>
                      )}
                    </div>
                  </div>

                  <button
                    className={`btn ${hotel.availableRoomsCount === 0 ? 'btn-secondary' : 'btn-primary'} w-100 mt-3 fw-bold py-2 rounded-3 shadow-sm`}
                    // FIX: Added fallback for id to prevent 'undefined' in URL
                    onClick={() => navigate(`/hotel/${hotel._id || hotel.id}`)}
                    disabled={hotel.availableRoomsCount === 0}
                  >
                    {hotel.availableRoomsCount === 0 ? 'Sold Out' : 'Check deal ›'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 border rounded-4 bg-light">
            <h5 className="text-dark">No featured hotels available</h5>
            <p className="text-muted">
              Try searching for another city or landmark.
            </p>
            <button
              className="btn btn-sm btn-dark"
              onClick={() => window.location.reload()}
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HotelPreview;
