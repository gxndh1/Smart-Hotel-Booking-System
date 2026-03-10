import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalFilters, resetFilters, selectActiveFilterCount, MIN_PRICE, MAX_PRICE } from './hotelSlice';
import { FaFilter, FaRegMoneyBillAlt, FaWifi, FaSwimmingPool, FaUtensils, FaParking, FaSearch, FaCheckCircle, FaRegCalendarCheck } from 'react-icons/fa';

const FilterNav = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.hotels);
  const activeFilterCount = useSelector(selectActiveFilterCount);

  // Local state for debounced search and price to prevent excessive API calls
  const [searchTerm, setSearchTerm] = useState(filters.searchQuery || "");
  const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax);

  // Sync local state with Redux (e.g. when filters are reset or updated from Hero)
  useEffect(() => {
    setSearchTerm(filters.searchQuery);
    setLocalPriceMax(filters.priceMax);
  }, [filters.searchQuery, filters.priceMax]);

  // Debounce updates to Redux
  useEffect(() => {
    const timer = setTimeout(() => {
      const updates = {};
      if (searchTerm !== filters.searchQuery) updates.searchQuery = searchTerm;
      if (localPriceMax !== filters.priceMax) updates.priceMax = localPriceMax;
      
      if (Object.keys(updates).length > 0) {
        dispatch(setGlobalFilters(updates));
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, localPriceMax, dispatch, filters.searchQuery, filters.priceMax]);

  const amenities = [
    { id: 'Free WiFi', icon: <FaWifi /> },
    { id: 'Pool', icon: <FaSwimmingPool /> },
    { id: 'Breakfast included', icon: <FaUtensils /> },
    { id: 'Parking', icon: <FaParking /> },
    { id: 'Free cancellation', icon: <FaRegCalendarCheck /> }
  ];

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    // Immediately update local state for priceMax (slider), but debounce the Redux dispatch
    if (name === 'priceMax') {
      setLocalPriceMax(numValue);
    } else {
      dispatch(setGlobalFilters({ [name]: numValue }));
    }
  };

  const toggleAmenity = (amenity) => {
    const newFeatures = filters.advancedFeatures.includes(amenity)
      ? filters.advancedFeatures.filter(f => f !== amenity)
      : [...filters.advancedFeatures, amenity];
    dispatch(setGlobalFilters({ advancedFeatures: newFeatures }));
  };

  return (
    <div className="filter-sidebar bg-white rounded-4 shadow-sm p-4 sticky-top" style={{ top: '100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <FaFilter className="text-primary" size={18} /> Filters
          {activeFilterCount > 0 && (
            <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.7rem' }}>
              {activeFilterCount}
            </span>
          )}
        </h5>
        {activeFilterCount > 0 && (
          <button 
            className="btn btn-link btn-sm text-decoration-none text-muted p-0 fw-bold"
            onClick={() => dispatch(resetFilters())}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Section */}
      <div className="mb-4">
        <label className="form-label small fw-bold text-uppercase text-muted mb-3">Search</label>
        <div className="input-group border rounded-3 overflow-hidden bg-light">
          <span className="input-group-text bg-transparent border-0 text-muted pe-0">
            <FaSearch size={14} />
          </span>
          <input 
            type="text" 
            className="form-control border-0 bg-transparent shadow-none ps-2" 
            placeholder="Hotel name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sort By Section */}
      <div className="mb-4">
        <label className="form-label small fw-bold text-uppercase text-muted mb-3">Sort Results By</label>
        <select 
          className="form-select border-light-subtle rounded-3 shadow-none"
          value={filters.sortBy}
          onChange={(e) => dispatch(setGlobalFilters({ sortBy: e.target.value }))}
        >
          <option>Rating & Recommended</option>
          <option>Price ascending</option>
          <option>Price descending</option>
        </select>
      </div>

      <hr className="my-4 opacity-10" />

      {/* Price Range Section */}
      <div className="mb-4">
        <label className="form-label small fw-bold text-uppercase text-muted mb-3 d-flex align-items-center gap-2">
          <FaRegMoneyBillAlt /> Price Range (per night)
        </label>
        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent border-end-0 text-muted">₹</span>
            <input 
              type="number" 
              name="priceMin"
              className="form-control border-start-0 ps-0" 
              placeholder="Min"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={filters.priceMin}
              onChange={handlePriceChange}
            />
          </div>
          <span className="text-muted">—</span>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent border-end-0 text-muted">₹</span>
            <input 
              type="number" 
              name="priceMax"
              className="form-control border-start-0 ps-0" 
              placeholder="Max"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={localPriceMax}
              onChange={handlePriceChange}
            />
          </div>
        </div>
        <div className="mt-3">
          <input 
            type="range" 
            className="form-range" 
            min={MIN_PRICE} 
            max={MAX_PRICE} 
            step="100"
            name="priceMax"
            value={localPriceMax}
            onChange={handlePriceChange}
          />
          <div className="d-flex justify-content-between small text-muted">
            <span>₹{MIN_PRICE}</span>
            <span>₹{MAX_PRICE.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <hr className="my-4 opacity-10" />

      {/* Availability Section */}
      <div className="mb-4">
        <label className="form-label small fw-bold text-uppercase text-muted mb-3">Availability</label>
        <div 
          className={`d-flex align-items-center justify-content-between p-2 rounded-3 cursor-pointer transition-all ${
            filters.onlyAvailable ? 'bg-primary-subtle border-primary' : 'hover-bg-light'
          }`}
          style={{ cursor: 'pointer', border: '1px solid transparent' }}
          onClick={() => dispatch(setGlobalFilters({ onlyAvailable: !filters.onlyAvailable }))}
        >
          <div className="d-flex align-items-center gap-3">
            <span className={filters.onlyAvailable ? 'text-primary' : 'text-secondary'}>
              <FaCheckCircle />
            </span>
            <span className="small fw-medium">Only show available</span>
          </div>
          <div className="form-check form-switch mb-0">
            <input 
              className="form-check-input cursor-pointer" 
              type="checkbox" 
              role="switch"
              checked={filters.onlyAvailable}
              onChange={() => {}} 
            />
          </div>
        </div>
      </div>

      <hr className="my-4 opacity-10" />

      {/* Amenities Section */}
      <div>
        <label className="form-label small fw-bold text-uppercase text-muted mb-3">Popular Amenities</label>
        <div className="d-flex flex-column gap-2">
          {amenities.map((amenity) => (
            <div 
              key={amenity.id}
              className={`d-flex align-items-center justify-content-between p-2 rounded-3 cursor-pointer transition-all ${
                filters.advancedFeatures.includes(amenity.id) ? 'bg-primary-subtle border-primary' : 'hover-bg-light'
              }`}
              style={{ cursor: 'pointer', border: '1px solid transparent' }}
              onClick={() => toggleAmenity(amenity.id)}
            >
              <div className="d-flex align-items-center gap-3">
                <span className={filters.advancedFeatures.includes(amenity.id) ? 'text-primary' : 'text-secondary'}>
                  {amenity.icon}
                </span>
                <span className="small fw-medium">{amenity.id}</span>
              </div>
              <div className={`form-check mb-0`}>
                <input 
                  className="form-check-input cursor-pointer" 
                  type="checkbox" 
                  checked={filters.advancedFeatures.includes(amenity.id)}
                  readOnly
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterNav;