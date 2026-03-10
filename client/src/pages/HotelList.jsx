import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectFilteredHotels, resetFilters, fetchHotels } from "../redux/hotelSlice"; 
import HotelCard from "../components/features/hotelList/HotelCard";
import NavBar from "../components/layout/NavBar";
import FilterNav from "../components/features/hotelList/FilterNav";
import Footer from "../components/layout/Footer";

const DEFAULT_FILTERS = {};

const HotelList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sortedHotels = useSelector(selectFilteredHotels);
  const filters = useSelector((state) => state.hotels?.filters) || DEFAULT_FILTERS;
  const { loading, error } = useSelector((state) => state.hotels);

  // Memoize filters string to prevent infinite loop if object reference changes
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    // Pass filters to fetchHotels for server-side filtering
    dispatch(fetchHotels(filters));
  }, [dispatch, filtersKey]);

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  return (
    <div className="bg-light min-vh-100">
      <NavBar />
      <FilterNav />

      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-end mb-3 px-1">
          <div>
            <h4 className="fw-bold mb-0 text-dark">
              {filters.location !== "Any region" ? `Hotels in ${filters.location}` : "All Properties"}
            </h4>
            {loading ? (
              <p className="placeholder-glow mb-0"><span className="placeholder col-4"></span></p>
            ) : (
              <p className="text-muted small mb-0">
                Found {sortedHotels.length} {sortedHotels.length === 1 ? 'property' : 'properties'} matching your criteria
              </p>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {loading && (
              [1, 2, 3].map((n) => (
                <div key={n} className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 placeholder-glow">
                  <div className="row g-0">
                    <div className="col-md-4">
                      <div className="placeholder w-100 h-100" style={{ minHeight: '220px' }}></div>
                    </div>
                    <div className="col-md-8">
                      <div className="card-body p-4 d-flex flex-column h-100">
                        <div className="mb-2">
                          <span className="placeholder col-6 py-3 mb-2 d-block"></span>
                          <span className="placeholder col-4 py-2"></span>
                        </div>
                        <div className="d-flex gap-2 mb-3">
                          <span className="placeholder col-2 py-2"></span>
                          <span className="placeholder col-3 py-2"></span>
                        </div>
                        <div className="mb-3">
                          <span className="placeholder col-5 py-2 mb-1 d-block"></span>
                          <span className="placeholder col-7 py-2"></span>
                        </div>
                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                          <div className="col-4">
                            <span className="placeholder col-8 py-1 mb-1 d-block"></span>
                            <span className="placeholder col-10 py-3"></span>
                          </div>
                          <span className="placeholder col-3 py-4 rounded-pill"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {error && <p className="text-danger">Error: {error}</p>}
            {!loading && !error && (
              sortedHotels.length > 0 ? (
                sortedHotels.map((hotel) => (
                  <HotelCard key={hotel._id} hotel={hotel} />
                ))
              ) : (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm border mt-3">
                  <div className="mb-4">
                    <i className="bi bi-search-heart display-1 text-muted opacity-50"></i>
                  </div>
                  <h5 className="fw-bold text-dark">No matches found</h5>
                  <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                    We couldn't find any hotels matching your current filters for <strong>{filters.location}</strong>. 
                    Try adjusting the price range or features.
                  </p>
                  <button 
                    className="btn btn-dark rounded-pill px-4 mt-3"
                    onClick={handleClearFilters}
                  >
                    Clear All Filters
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HotelList;
