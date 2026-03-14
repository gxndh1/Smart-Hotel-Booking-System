import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { createHotel, updateHotel, fetchHotelById } from '../redux/hotelSlice';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { selectManagers } from '../redux/adminSlice';

const AddHotel = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    const auth = useSelector((state) => state.auth);
    const managers = useSelector(selectManagers);
    const currentManager = auth.user;
    const userRole = (auth.user?.role || auth.user?.Role || "").toLowerCase();
    const isAdmin = userRole === 'admin';
    


    // CHECK IF EDITING
    const editHotelFromState = location.state?.editHotel;
    const editHotelIdFromQuery = searchParams.get('edit');
    const [fetchedHotel, setFetchedHotel] = useState(null);
    const [loadingHotel, setLoadingHotel] = useState(false);
    


    // CHECK IF EDITING FROM QUERY PARAM
    const isEditingFromQuery = !!editHotelIdFromQuery;
    


    // FETCH HOTEL DATA IF EDITING FROM QUERY PARAM
    useEffect(() => {
        if (editHotelIdFromQuery) {
            setLoadingHotel(true);
            dispatch(fetchHotelById(editHotelIdFromQuery))
                .unwrap()
                .then((data) => {
                    setFetchedHotel(data);
                })
                .catch(err => console.error('Error fetching hotel:', err))
                .finally(() => setLoadingHotel(false));
        }
    }, [editHotelIdFromQuery]);
    


    // CHECK IF EDITING
    const isEditing = location.state?.isEditing || isEditingFromQuery;
    


    // GET THE HOTEL TO EDIT - PREFER STATE, THEN FETCHED DATA
    const editHotel = editHotelFromState || fetchedHotel;
    


    // LOAAD HOTEL DATA IN FORM
    const [formData, setFormData] = useState({
        name: editHotel?.Name || editHotel?.name || '',
        location: editHotel?.Location || editHotel?.location || '',
        description: editHotel?.description || '',
        reviewsCount: editHotel?.reviewsCount || 0,
        tag: editHotel?.tag || 'New',
        image: editHotel?.Image || editHotel?.image || '',
        offer: editHotel?.offer || 'Welcome Offer',
        features: editHotel?.features || [],
        amenities: editHotel?.Amenities || editHotel?.amenities || [],
        managerId: editHotel?.managerId || (isAdmin ? '' : (currentManager?._id || currentManager?.id))
    });
    
    const [selectedFeatures, setSelectedFeatures] = useState(editHotel?.features || editHotel?.Features || []);
    const [selectedAmenities, setSelectedAmenities] = useState(editHotel?.amenities || editHotel?.Amenities || []);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    


    // AVAILABLE FEATURES AND AMENITIES
    const availableFeatures = ['Sea View', 'City View', 'Garden View', 'Mountain View', 'Travel Desk', 'Lake View', 'Heritage Building', 'Nightlife Access', 'Luxury Spa', 'Club Access'];
    const availableAmenities = ['Free WiFi', 'Pool', 'Breakfast included', 'Gym', 'Spa', 'Restaurant', 'Free cancellation', 'Concierge', 'Business Center', 'Fitness Center'];
    


    // MANAGER AND ADMIN IS ALLOWED
    useEffect(() => {
        if (userRole !== 'manager' && userRole !== 'admin') {
            navigate('/');
        }
    }, [userRole, navigate]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    


    // TOGGLE FEATURE
    const handleFeatureToggle = (feature) => {
        setSelectedFeatures(prev => 
            prev.includes(feature) 
                ? prev.filter(f => f !== feature)
                : [...prev, feature]
        );
    };
    

    // TOGGLE AMENITY
    const handleAmenityToggle = (amenity) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity) 
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };
    

    // VALIDATE FORM
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Hotel name is required';
        }
        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }
        if (!formData.image.trim()) {
            newErrors.image = 'Hotel image URL is required';
        }
        if (selectedFeatures.length === 0) {
            newErrors.features = 'Select at least one feature';
        }
        if (selectedAmenities.length === 0) {
            newErrors.amenities = 'Select at least one amenity';
        }
        if (isAdmin && !formData.managerId) {
            newErrors.managerId = 'Please select a manager for the hotel';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    

    // HANDLE SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const hotelPayload = {
                name: formData.name,
                location: formData.location,
                description: formData.description,
                amenities: selectedAmenities,
                features: selectedFeatures,
                tag: formData.tag,
                offer: formData.offer,
                image: formData.image,
                managerId: formData.managerId
            };

            if (isEditing) {
                await dispatch(updateHotel({ id: editHotel._id, hotelData: hotelPayload })).unwrap();
                alert(`${formData.name} is updated`);
            } else {
                await dispatch(createHotel(hotelPayload)).unwrap();
                alert(`${formData.name} is created successfully!`);
            }
            

            // RESET FORM
            setFormData({
                name: '',
                location: '',
                description: '',
                reviewsCount: 0,
                tag: 'New',
                image: '',
                offer: 'Welcome Offer',
                features: [],
                amenities: [],
                managerId: isAdmin ? '' : currentManager?.id
            });
            setSelectedFeatures([]);
            setSelectedAmenities([]);
            


            // REDIRECT BASED ON USER ROLE
            setTimeout(() => {
                if (isAdmin) {
                    navigate('/admin', { state: { activeTab: 'hotels' } });
                } else {
                    navigate('/manager');
                }
            }, 1500);
        } catch (error) {
            console.error('Error saving hotel:', error);
            setErrors({ submit: 'Failed to save hotel. Please try again.' });
        }
    };
    

    // UI
    return (
        <div className="d-flex flex-column min-vh-100">
            <NavBar />
            
            <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', paddingTop: '40px', paddingBottom: '40px' }}>
                <div className="container">
                    {/* Header */}
                    <div className="mb-4">
                        <button 
                            onClick={() => isAdmin ? navigate('/admin') : navigate('/manager')}
                            className="btn btn-outline-secondary rounded-pill mb-3 d-flex align-items-center gap-2"
                        >
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <h2 className="fw-bold">{isEditing ? '✏️ Edit Hotel Property' : '➕ Add New Hotel Property'}</h2>
                        <p className="text-muted">{isEditing ? 'Update the details of your property' : 'Fill in the details below to list your property'}</p>
                    </div>
                    
                    {/* Success Message */}
                    {successMessage && (
                        <div className="alert alert-success border-0 rounded-4 mb-4" role="alert">
                            <strong>Success!</strong> {successMessage}
                        </div>
                    )}
                    
                    {/* Error Message */}
                    {errors.submit && (
                        <div className="alert alert-danger border-0 rounded-4 mb-4" role="alert">
                            {errors.submit}
                        </div>
                    )}
                    
                    {/* Loading state for fetching hotel data */}
                    {loadingHotel ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">Loading hotel data...</p>
                        </div>
                    ) : (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                {/* Basic Information */}
                                <h5 className="fw-bold mb-3">Basic Information</h5>
                                
                                <div className="row mb-4 g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Hotel Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`form-control rounded-3 ${errors.name ? 'is-invalid' : ''}`}
                                            placeholder="Enter hotel name"
                                        />
                                        {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Location *</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className={`form-control rounded-3 ${errors.location ? 'is-invalid' : ''}`}
                                            placeholder="e.g., Mumbai, Goa, Jaipur"
                                        />
                                        {errors.location && <div className="invalid-feedback d-block">{errors.location}</div>}
                                    </div>
                                </div>
                                
                                <div className="row mb-4 g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small">Description *</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="form-control rounded-3"
                                            rows="3"
                                            placeholder="Describe your property..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="row mb-4 g-3">
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold small">Tag</label>
                                        <input
                                            type="text"
                                            name="tag"
                                            value={formData.tag}
                                            onChange={handleInputChange}
                                            className="form-control rounded-3"
                                            placeholder="e.g., New, Recommended, Featured"
                                        />
                                    </div>
                                </div>

                                {/* Manager Selection for Admin */}
                                {isAdmin && (
                                    <div className="row mb-4 g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Assign Manager *</label>
                                            <select
                                                name="managerId"
                                                value={formData.managerId}
                                                onChange={handleInputChange}
                                                className={`form-control rounded-3 ${errors.managerId ? 'is-invalid' : ''}`}
                                            >
                                                <option value="">-- Select a Manager --</option>
                                                {managers.map(manager => (
                                                    <option key={manager._id || manager.id} value={manager._id || manager.id}>
                                                        {manager.name} ({manager.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.managerId && <div className="invalid-feedback d-block">{errors.managerId}</div>}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Image and Offer */}
                                <div className="row mb-4 g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small">Hotel Image URL *</label>
                                        <input
                                            type="url"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            className={`form-control rounded-3 ${errors.image ? 'is-invalid' : ''}`}
                                            placeholder="https://example.com/hotel-image.jpg"
                                        />
                                        {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
                                        {formData.image && (
                                            <div className="mt-3">
                                                <img 
                                                    src={formData.image} 
                                                    alt="Preview" 
                                                    className="img-thumbnail rounded-3"
                                                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                                                    onError={(e) => { e.target.onError = null; e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"; }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="row mb-4 g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small">Current Offer</label>
                                        <input
                                            type="text"
                                            name="offer"
                                            value={formData.offer}
                                            onChange={handleInputChange}
                                            className="form-control rounded-3"
                                            placeholder="e.g., 15% OFF for Credit Cards"
                                        />
                                    </div>
                                </div>
                                
                                <hr />
                                
                                {/* Features */}
                                <h5 className="fw-bold mb-3">Features *</h5>
                                <div className="row mb-4 g-2">
                                    {availableFeatures.map(feature => (
                                        <div key={feature} className="col-md-6 col-lg-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`feature-${feature}`}
                                                    checked={selectedFeatures.includes(feature)}
                                                    onChange={() => handleFeatureToggle(feature)}
                                                />
                                                <label className="form-check-label" htmlFor={`feature-${feature}`}>
                                                    {feature}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.features && <div className="text-danger small mb-4">{errors.features}</div>}
                                
                                <hr />
                                
                                {/* Amenities */}
                                <h5 className="fw-bold mb-3">Amenities *</h5>
                                <div className="row mb-4 g-2">
                                    {availableAmenities.map(amenity => (
                                        <div key={amenity} className="col-md-6 col-lg-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`amenity-${amenity}`}
                                                    checked={selectedAmenities.includes(amenity)}
                                                    onChange={() => handleAmenityToggle(amenity)}
                                                />
                                                <label className="form-check-label" htmlFor={`amenity-${amenity}`}>
                                                    {amenity}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.amenities && <div className="text-danger small mb-4">{errors.amenities}</div>}
                                
                                <hr />
                                
                                {/* Submit Button */}
                                <div className="d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/manager')}
                                        className="btn btn-outline-secondary rounded-pill px-5"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn btn-primary rounded-pill px-5 d-flex align-items-center gap-2"
                                    >
                                        <FaPlus /> Add Hotel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    )}
                </div>
            
            </div>
            
            <Footer />
        </div>
    );
};

export default AddHotel;
