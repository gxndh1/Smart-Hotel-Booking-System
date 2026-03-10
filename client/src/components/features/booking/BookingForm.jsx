import React, { useState, useEffect, useRef, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import { FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import "react-datepicker/dist/react-datepicker.css";

const BookingForm = ({ hotel, room, user, initialEmail, onSubmit }) => {
    // Get today's date at midnight for proper comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine maximum rooms allowed based on inventory and system limit (10)
    const maxAvailable = Math.min(10, room?.totalRooms || room?.TotalRooms || 1);

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(new Date(today.getTime() + 86400000)); // tomorrow
    const [checkInTime, setCheckInTime] = useState('14:00');
    const [checkOutTime, setCheckOutTime] = useState('11:00');
    const [numberOfRooms, setNumberOfRooms] = useState(1);
    const [guestDetails, setGuestDetails] = useState({
        firstName: '',
        lastName: '',
        email: initialEmail || '',
        phone: ''
    });
    const [additionalGuests, setAdditionalGuests] = useState([]);
    const [errors, setErrors] = useState({});
    const timerRef = useRef(null);

    // Pre-fill form with user data when user prop is available
    useEffect(() => {
        if (user) {
            // Parse Name into firstName and lastName - check both name and Name
            const fullName = user.name || user.Name || '';
            const nameParts = fullName ? fullName.split(' ') : ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setGuestDetails(prev => ({
                firstName: prev.firstName || firstName || '',
                lastName: prev.lastName || lastName || '',
                email: prev.email || user.email || user.Email || initialEmail || '',
                phone: prev.phone || user.phone || user.contactNumber || user.ContactNumber || ''
            }));
        }
    }, [user, initialEmail]);

    const addGuest = () => {
        if (additionalGuests.length < (room?.capacity || 4) - 1) {
            setAdditionalGuests([...additionalGuests, { name: '' }]);
        }
    };

    const removeGuest = (index) => {
        setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
    };

    const calculateNights = () => {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate guest details
        if (!guestDetails.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!guestDetails.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!guestDetails.email.trim()) newErrors.email = 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) newErrors.email = 'Invalid email format';
        if (!guestDetails.phone.trim()) newErrors.phone = 'Phone is required';
        if (!/^\d{10,}$/.test(guestDetails.phone.replace(/[-\s]/g, ''))) newErrors.phone = 'Phone must be at least 10 digits';

        // Validate room inventory
        if (numberOfRooms > maxAvailable) {
            newErrors.numberOfRooms = `Only ${maxAvailable} rooms are available for this type.`;
        }

        // Validate dates
        if (startDate >= endDate) {
            newErrors.dates = 'Check-out date must be after check-in date';
        }

        // Compare dates properly - check if check-in date is before today
        const checkInDate = new Date(startDate);
        checkInDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        if (checkInDate < todayDate) {
            newErrors.startDate = 'Check-in date cannot be in the past';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nights = calculateNights();

    // LIVE UPDATE EFFECT: Updates the sidebar but does NOT open the modal
    // Use refs to avoid circular dependency - only depend on primitive values
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            onSubmit({
                ...guestDetails,
                checkIn: startDate,
                checkOut: endDate,
                checkInTime,
                checkOutTime,
                nights: nights,
                numberOfRooms: numberOfRooms,
                additionalGuests: additionalGuests.map(g => g.name).filter(n => n.trim() !== ''),
                isDraft: true // Key: Tells parent NOT to show the modal
            });
        }, 500);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [startDate, endDate, guestDetails, checkInTime, checkOutTime, onSubmit]);

    // FINAL SUBMIT: Triggered ONLY by the button click
    const handleFinalSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit({
            ...guestDetails,
            checkIn: startDate,
            checkOut: endDate,
            checkInTime,
            checkOutTime,
            nights: nights,
            numberOfRooms: numberOfRooms,
            additionalGuests: additionalGuests.map(g => g.name).filter(n => n.trim() !== ''),
            isDraft: false // Key: Tells parent TO show the modal
        });
    };

    return (
        <form onSubmit={handleFinalSubmit} className="border-0 p-2">
            {/* Validation Errors Alert */}
            {Object.keys(errors).length > 0 && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <strong>Please fix the following errors:</strong>
                    <ul className="mb-0 mt-2">
                        {Object.values(errors).map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <FaUser className="text-primary" /> Primary Guest
                </h5>
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="form-floating">
                            <input
                                type="text"
                                className={`form-control border-0 bg-light rounded-3 ${errors.firstName ? 'is-invalid' : ''}`}
                                id="firstName" placeholder="First Name"
                                value={guestDetails.firstName}
                                onChange={(e) => setGuestDetails({ ...guestDetails, firstName: e.target.value })}
                            />
                            <label htmlFor="firstName">First Name</label>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-floating">
                            <input
                                type="text"
                                className={`form-control border-0 bg-light rounded-3 ${errors.lastName ? 'is-invalid' : ''}`}
                                id="lastName" placeholder="Last Name"
                                value={guestDetails.lastName}
                                onChange={(e) => setGuestDetails({ ...guestDetails, lastName: e.target.value })}
                            />
                            <label htmlFor="lastName">Last Name</label>
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-floating">
                            <input
                                type="email"
                                className={`form-control border-0 bg-light rounded-3 ${errors.email ? 'is-invalid' : ''}`}
                                id="email" placeholder="Email"
                                value={guestDetails.email}
                                onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Guests Section */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Additional Guests</h5>
                    <button type="button" onClick={addGuest} className="btn btn-outline-primary btn-sm rounded-pill px-3">
                        <FaPlus size={12} className="me-1" /> Add Guest
                    </button>
                </div>
                {additionalGuests.map((guest, index) => (
                    <div key={index} className="d-flex gap-2 mb-2 animate__animated animate__fadeIn">
                        <div className="form-floating flex-grow-1">
                            <input
                                type="text" className="form-control border-0 bg-light rounded-3"
                                placeholder="Guest Name"
                                value={guest.name}
                                onChange={(e) => {
                                    const newGuests = [...additionalGuests];
                                    newGuests[index].name = e.target.value;
                                    setAdditionalGuests(newGuests);
                                }}
                            />
                            <label>Guest {index + 2} Full Name</label>
                        </div>
                        <button type="button" onClick={() => removeGuest(index)} className="btn btn-light text-danger rounded-3 px-3">
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Check-in Date *</label>
                    <DatePicker
                        selected={startDate}
                        className={`form-control w-100 rounded-3 ${errors.startDate || errors.dates ? 'is-invalid' : ''}`}
                        minDate={new Date()}
                        onChange={(date) => {
                            setStartDate(date);
                            if (date >= endDate) setEndDate(new Date(date.getTime() + 86400000));
                            if (errors.startDate || errors.dates) setErrors({ ...errors, startDate: '', dates: '' });
                        }}
                    />
                    {(errors.startDate || errors.dates) && <div className="invalid-feedback d-block">{errors.startDate || errors.dates}</div>}
                </div>
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Check-in Time *</label>
                    <input
                        type="time"
                        className="form-control rounded-3"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Check-out Date *</label>
                    <DatePicker
                        selected={endDate}
                        className={`form-control w-100 rounded-3 ${errors.dates ? 'is-invalid' : ''}`}
                        minDate={new Date(startDate.getTime() + 86400000)}
                        onChange={(date) => {
                            setEndDate(date);
                            if (errors.dates) setErrors({ ...errors, dates: '' });
                        }}
                    />
                    {errors.dates && <div className="invalid-feedback d-block">{errors.dates}</div>}
                </div>
                <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Check-out Time *</label>
                    <input
                        type="time"
                        className="form-control rounded-3"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-12">
                    <label className="form-label small fw-bold text-muted">Number of Rooms *</label>
                    <div className="d-flex align-items-center">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-3"
                            onClick={() => setNumberOfRooms(Math.max(1, numberOfRooms - 1))}
                        >
                            <i className="bi bi-dash"></i>
                        </button>
                        <span className="mx-3 fw-bold fs-5">{numberOfRooms}</span>
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-3"
                            onClick={() => setNumberOfRooms(Math.min(maxAvailable, numberOfRooms + 1))}
                        >
                            <i className="bi bi-plus"></i>
                        </button>
                        <span className="ms-3 text-muted small">(Max {maxAvailable} rooms available)</span>
                    </div>
                </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-pill">
                Continue to Payment <i className="bi bi-arrow-right ms-2"></i>
            </button>
        </form>
    );
};

export default BookingForm;