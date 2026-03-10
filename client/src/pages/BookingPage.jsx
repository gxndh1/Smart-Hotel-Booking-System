
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { createBooking } from "../redux/bookingSlice";
import { createPayment } from "../redux/paymentSlice";
import { selectAllHotels, fetchHotelById } from "../redux/hotelSlice";
import { selectRoomsByHotel, fetchRoomsByHotel } from "../redux/roomSlice";
import { fetchUserLoyalty, selectRedemptionPoints } from "../redux/loyaltySlice";
import BookingForm from "../components/features/booking/BookingForm";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { 
  FaCheck, FaUserFriends, FaCreditCard, FaClipboardCheck, 
  FaUtensils, FaPlaneDeparture, FaArrowLeft, FaUniversity, 
  FaMobileAlt, FaWallet, FaGift, FaShieldAlt 
} from "react-icons/fa";

const BookingPage = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const allHotels = useSelector(selectAllHotels);
  const roomsByHotel = useSelector((state) => selectRoomsByHotel(state, hotelId));
  const auth = useSelector((state) => state.auth || {});
  const currentUser = auth.user;
  const role = (currentUser?.role || currentUser?.Role || 'guest').toLowerCase();
  const isAuthenticated = auth.isAuthenticated;
  const redemptionPointsBalance = useSelector(selectRedemptionPoints);

  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [redemptionPointsUsed, setRedemptionPointsUsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(2); // Start at Step 2 (Guest Details)
  const [extras, setExtras] = useState({
    breakfast: false,
    airportPickup: false
  });
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [redemptionError, setRedemptionError] = useState('');

  const steps = [
    { id: 1, label: "Select Room", icon: <FaCheck /> },
    { id: 2, label: "Guest Details", icon: <FaUserFriends /> },
    { id: 3, label: "Payment & Extras", icon: <FaCreditCard /> },
    { id: 4, label: "Confirmation", icon: <FaClipboardCheck /> },
  ];

  // Ensure data is fetched if missing (e.g., on page refresh)
  useEffect(() => {
    if (hotelId) dispatch(fetchHotelById(hotelId));
    if (hotelId) dispatch(fetchRoomsByHotel(hotelId));
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserLoyalty());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthenticated) {
      navigate("/login", { 
        state: { redirectTo: `/booking/${hotelId}/${roomId}`, message: "Please login to book a hotel" } 
      });
    }
  }, [isAuthenticated, hotelId, roomId, navigate]);

  useEffect(() => {
    const foundHotel = allHotels.find((h) => String(h._id || h.id) === String(hotelId));
    const foundRoom = roomsByHotel.find((r) => String(r._id || r.id) === String(roomId));

    if (foundHotel && foundRoom) {
      setHotel(foundHotel);
      setRoom(foundRoom);
      setLoading(false);
    } else if (allHotels.length > 0 && roomsByHotel.length > 0 && currentStep < 3) {
      // Data is loaded but specific IDs not found - only redirect if still in selection phase.
      // Once payment starts (Step 3+), we rely on the local 'hotel' and 'room' state.
      navigate("/error", {
        state: { message: "The room or hotel you are trying to book is no longer available." },
      });
    }
  }, [hotelId, roomId, allHotels, roomsByHotel, navigate, currentStep]);

  const priceCalculation = useMemo(() => {
    if (!room) return { base: 0, tax: 0, total: 0 };
    const nights = bookingSummary?.nights || 1;
    const numberOfRooms = bookingSummary?.numberOfRooms || 1;
    const base = (room.price ?? room.Price ?? 0) * nights * numberOfRooms;
    const tax = base * 0.12;
    
    const extrasTotal = (extras.breakfast ? 500 * nights * numberOfRooms : 0) + 
                        (extras.airportPickup ? 1200 : 0);
    
    const redemptionDiscount = redemptionPointsUsed;
    const total = base + tax + extrasTotal - redemptionDiscount;
    return { base, tax, total: total > 0 ? total : 0, numberOfRooms, nights, redemptionDiscount, extrasTotal };
  }, [room, bookingSummary, redemptionPointsUsed, extras]);

  const handleFormSubmit = useCallback((formData) => {
    setBookingSummary(formData);
    if (formData.isDraft === false) {
      setCurrentStep(3);
    }
  }, []);

  const handleRedemptionChange = useCallback((points) => {
    setRedemptionPointsUsed(points);
  }, []);

  const validatePaymentForm = () => {
    const errors = {};
    if (selectedPaymentMethod === 'card') {
      if (!paymentFormData.cardNumber || paymentFormData.cardNumber.replace(/\s/g, '').length < 13) errors.cardNumber = 'Valid card number required';
      if (!paymentFormData.cardHolder) errors.cardHolder = 'Cardholder name required';
      if (!paymentFormData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentFormData.expiryDate)) errors.expiryDate = 'Expiry date (MM/YY) required';
      if (!paymentFormData.cvv || paymentFormData.cvv.length < 3) errors.cvv = 'Valid CVV required';
    } else if (selectedPaymentMethod === 'upi') {
      const cleanPhone = (paymentFormData.phoneNumber || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) errors.phoneNumber = '10-digit phone number required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentConfirm = useCallback(async () => {
    if (!validatePaymentForm()) return;

    if (!bookingSummary || !room || !hotel) {
      navigate("/error", { state: { message: "Booking session expired. Please restart the booking process." } });
      return;
    }

    try {
      setCurrentStep(4);
      const usedRedemptionPoints = redemptionPointsUsed;
      const userId = currentUser?._id || currentUser?.id;

      const checkInDate = bookingSummary.checkIn instanceof Date 
        ? bookingSummary.checkIn.toISOString() 
        : String(bookingSummary.checkIn);
      const checkOutDate = bookingSummary.checkOut instanceof Date 
        ? bookingSummary.checkOut.toISOString() 
        : String(bookingSummary.checkOut);

      const redemptionDiscount = usedRedemptionPoints;

      const selectedExtras = Object.entries(extras)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name);

      const newBooking = {
        roomId: room._id || room.id,
        hotelId: hotel._id || hotel.id,
        numberOfRooms: bookingSummary.numberOfRooms || 1,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        checkInTime: bookingSummary.checkInTime || '14:00',
        checkOutTime: bookingSummary.checkOutTime || '11:00',
        redemptionPointsUsed: usedRedemptionPoints,
        redemptionDiscountAmount: redemptionDiscount,
        extras: selectedExtras,
        extrasAmount: priceCalculation.extrasTotal
      };

      const bookingResult = await dispatch(createBooking(newBooking)).unwrap();
      // Extract ID directly from the unwrapped result
      const savedBookingId = bookingResult?._id || bookingResult?.id || bookingResult?.data?._id;
      if (!savedBookingId) throw new Error("Failed to retrieve booking ID from server.");

      const paymentMethodNames = {
        'card': 'Credit/Debit Card',
        'bank': 'Bank Transfer',
        'upi': 'UPI',
        'netbanking': 'Net Banking'
      };
      const paymentMethodName = paymentMethodNames[selectedPaymentMethod] || 'Credit/Debit Card';
      
      const paymentResult = await dispatch(createPayment({
        bookingId: savedBookingId,
        userId: userId, // Backend uses req.user.id, but we pass this for consistency
        amount: priceCalculation.total,
        status: 'paid',
        paymentMethod: paymentMethodName
      })).unwrap();

      const savedPaymentId = paymentResult?._id || paymentResult?.id || paymentResult?.data?._id;

      // Refresh loyalty points after successful payment
      if (isAuthenticated) {
        dispatch(fetchUserLoyalty());
      }

      // Navigate to Success Page with all required data
      navigate("/booking-success", {
        replace: true,
        state: {
          bookingData: {
            bookingId: String(savedBookingId),
            paymentId: String(savedPaymentId || 'N/A'),
            hotelName: hotel.name,
            roomType: room.type,
            userName: currentUser?.name || currentUser?.Name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Guest',
            userEmail: currentUser?.email,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            checkInTime: bookingSummary.checkInTime || '14:00',
            checkOutTime: bookingSummary.checkOutTime || '11:00',
            nights: bookingSummary.nights || 1,
            numberOfRooms: bookingSummary.numberOfRooms || 1,
            totalAmount: priceCalculation.total,
            pointsEarned: paymentResult.pointsEarned || Math.floor(priceCalculation.total * 0.1),
            redemptionPointsUsed: usedRedemptionPoints,
            redemptionDiscount: redemptionDiscount
          }
        }
      });
    } catch (error) {
      console.error("Post-payment processing failed:", error);
      const errorMsg = error?.message || (typeof error === 'string' ? error : "We encountered an issue finalizing your booking.");
      navigate("/error", { state: { message: errorMsg } });
    }
  }, [bookingSummary, priceCalculation, hotel, room, currentUser, dispatch, navigate, selectedPaymentMethod, redemptionPointsUsed, extras, isAuthenticated, paymentFormData]);

  if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="bg-white min-vh-100">
      <NavBar />
      
      {/* Modern Stepper */}
      <div className="bg-light border-bottom py-4 mb-5 sticky-top" style={{ top: '70px', zIndex: 100 }}>
        <div className="container">
          <div className="d-flex justify-content-between position-relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="position-absolute top-50 start-0 translate-middle-y w-100 bg-secondary bg-opacity-25" style={{ height: '2px', zIndex: 0 }}></div>
            <div className="position-absolute top-50 start-0 translate-middle-y bg-primary transition-all" style={{ height: '2px', width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, zIndex: 1 }}></div>
            
            {steps.map((step) => (
              <div key={step.id} className="text-center position-relative" style={{ zIndex: 2 }}>
                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 transition-all ${
                  currentStep >= step.id ? 'bg-primary text-white shadow' : 'bg-white text-muted border'
                }`} style={{ width: '40px', height: '40px', fontWeight: 'bold' }}>
                  {currentStep > step.id ? <FaCheck size={14} /> : step.id}
                </div>
                <span className={`small fw-bold ${currentStep >= step.id ? 'text-dark' : 'text-muted'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container pb-5">
        <div className="row g-4">
          <div className="col-lg-8">
            {currentStep === 2 && (
              <div className="animate__animated animate__fadeIn">
                <div className="mb-4">
                  <h2 className="fw-bold text-dark">Guest Information</h2>
                  <p className="text-muted">Please provide the details of the primary guest and any additional travelers.</p>
                </div>
                <BookingForm
                  hotel={hotel}
                  room={room}
                  user={{
                    ...currentUser, 
                    name: currentUser?.name || currentUser?.Name, 
                    email: currentUser?.email || currentUser?.Email,
                    phone: currentUser?.contactNumber || currentUser?.ContactNumber || currentUser?.phone
                  }}
                  initialEmail={currentUser?.email || currentUser?.Email}
                  onSubmit={handleFormSubmit}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate__animated animate__fadeIn">
                <div className="mb-4 d-flex align-items-center gap-3">
                  <button onClick={() => setCurrentStep(2)} className="btn btn-light rounded-circle p-2" style={{ width: '40px', height: '40px' }}>
                    <FaArrowLeft />
                  </button>
                  <div>
                    <h2 className="fw-bold text-dark mb-0">Payment & Extras</h2>
                    <p className="text-muted mb-0">Customize your stay and complete your secure payment.</p>
                  </div>
                </div>

                {/* Extras Section */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <h5 className="fw-bold mb-4">Enhance Your Stay</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className={`card border-2 rounded-4 p-3 cursor-pointer transition-all ${extras.breakfast ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                           onClick={() => setExtras(prev => ({...prev, breakfast: !prev.breakfast}))}>
                        <div className="d-flex justify-content-between align-items-center">
                          <FaUtensils className={extras.breakfast ? 'text-primary' : 'text-muted'} />
                          <div className={`form-check form-switch mb-0`}><input className="form-check-input" type="checkbox" checked={extras.breakfast} readOnly /></div>
                        </div>
                        <div className="fw-bold mt-2">Daily Breakfast</div>
                        <small className="text-muted">₹500 / day / room</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className={`card border-2 rounded-4 p-3 cursor-pointer transition-all ${extras.airportPickup ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                           onClick={() => setExtras(prev => ({...prev, airportPickup: !prev.airportPickup}))}>
                        <div className="d-flex justify-content-between align-items-center">
                          <FaPlaneDeparture className={extras.airportPickup ? 'text-primary' : 'text-muted'} />
                          <div className={`form-check form-switch mb-0`}><input className="form-check-input" type="checkbox" checked={extras.airportPickup} readOnly /></div>
                        </div>
                        <div className="fw-bold mt-2">Airport Pickup</div>
                        <small className="text-muted">₹1,200 fixed</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redemption Section */}
                {role === 'guest' && redemptionPointsBalance > 0 && (
                  <div className="bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 p-4 mb-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <FaGift className="text-warning fs-4" />
                      <div>
                        <h6 className="fw-bold mb-0">Redeem Loyalty Points</h6>
                        <small className="text-muted">Available: {redemptionPointsBalance} points (1 point = ₹1)</small>
                      </div>
                    </div>
                    <div className="input-group">
                      <input 
                        type="number" className={`form-control border-0 bg-white rounded-start-3 ${redemptionError ? 'is-invalid' : ''}`}
                        placeholder="Enter points (max 500)" value={redemptionPointsUsed || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val > 500) setRedemptionError('Max 500 points');
                          else if (val > redemptionPointsBalance) setRedemptionError('Insufficient balance');
                          else { setRedemptionError(''); handleRedemptionChange(val); }
                        }}
                      />
                      <span className="input-group-text border-0 bg-white text-success fw-bold rounded-end-3">-₹{redemptionPointsUsed}</span>
                    </div>
                    {redemptionError && <div className="text-danger small mt-1">{redemptionError}</div>}
                  </div>
                )}

                {/* Payment Methods */}
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <h5 className="fw-bold mb-4">Payment Method</h5>
                  <div className="row g-3 mb-4">
                    {[
                      { id: 'card', name: 'Card', icon: <FaCreditCard /> },
                      { id: 'upi', name: 'UPI', icon: <FaMobileAlt /> },
                      { id: 'bank', name: 'Bank', icon: <FaUniversity /> }
                    ].map(method => (
                      <div key={method.id} className="col-4">
                        <button 
                          className={`btn w-100 py-3 rounded-3 border-2 d-flex flex-column align-items-center gap-2 transition-all ${selectedPaymentMethod === method.id ? 'btn-primary border-primary shadow' : 'btn-outline-light text-dark border-light'}`}
                          onClick={() => {
                            setSelectedPaymentMethod(method.id);
                            setFormErrors({});
                            
                            // Prefill phone number for UPI if available in user profile and field is empty
                            if (method.id === 'upi' && currentUser && !paymentFormData.phoneNumber) {
                              const userPhone = currentUser.contactNumber || currentUser.ContactNumber || currentUser.phone || '';
                              if (userPhone) {
                                const cleanPhone = userPhone.replace(/\D/g, '').slice(-10);
                                setPaymentFormData(prev => ({ ...prev, phoneNumber: cleanPhone }));
                              }
                            }

                            // Prefill cardholder name for card if available in user profile and field is empty
                            if (method.id === 'card' && currentUser && !paymentFormData.cardHolder) {
                              const userName = currentUser.name || currentUser.Name || '';
                              if (userName) {
                                setPaymentFormData(prev => ({ ...prev, cardHolder: userName }));
                              }
                            }
                          }}
                        >
                          {method.icon} <span className="small fw-bold">{method.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedPaymentMethod === 'card' && (
                    <div className="animate__animated animate__fadeIn">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="small fw-bold text-muted mb-2">Card Number (16 Digits)</label>
                          <div className="d-flex gap-2">
                            {[0, 1, 2, 3].map((i) => (
                              <input
                                key={i}
                                type="text"
                                id={`cardPart${i}`}
                                className={`form-control text-center bg-transparent border-0 border-bottom rounded-0 ${formErrors.cardNumber ? 'is-invalid' : ''}`}
                                style={{ borderBottom: '2px solid #1e3a8a !important', boxShadow: 'none' }}
                                placeholder="0000"
                                maxLength="4"
                                value={paymentFormData.cardNumber.substring(i * 4, (i + 1) * 4)}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const currentNum = paymentFormData.cardNumber.padEnd(16, ' ');
                                  const parts = [
                                    currentNum.substring(0, 4),
                                    currentNum.substring(4, 8),
                                    currentNum.substring(8, 12),
                                    currentNum.substring(12, 16)
                                  ];
                                  parts[i] = val.padEnd(4, ' ');
                                  const newNumber = parts.join('').replace(/\s/g, '');
                                  setPaymentFormData({ ...paymentFormData, cardNumber: newNumber });
                                  if (val.length === 4 && i < 3) {
                                    document.getElementById(`cardPart${i + 1}`).focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !e.target.value && i > 0) {
                                    document.getElementById(`cardPart${i - 1}`).focus();
                                  }
                                }}
                              />
                            ))}
                          </div>
                          {formErrors.cardNumber && <div className="text-danger small mt-1">{formErrors.cardNumber}</div>}
                        </div>
                        <div className="col-12">
                          <div className="form-floating">
                            <input type="text" className={`form-control bg-light border-0 ${formErrors.cardHolder ? 'is-invalid' : ''}`} placeholder="Name" value={paymentFormData.cardHolder} onChange={(e) => setPaymentFormData({...paymentFormData, cardHolder: e.target.value})} />
                            <label>Cardholder Name</label>
                            {formErrors.cardHolder && <div className="invalid-feedback d-block">{formErrors.cardHolder}</div>}
                          </div>
                        </div>
                        <div className="col-8">
                          <label className="small fw-bold text-muted mb-2">Expiry Date</label>
                          <div className="d-flex gap-2">
                            <select 
                              className={`form-select bg-light border-0 rounded-3 ${formErrors.expiryDate ? 'is-invalid' : ''}`}
                              value={paymentFormData.expiryDate.split('/')[0] || ''}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, expiryDate: `${e.target.value}/${paymentFormData.expiryDate.split('/')[1] || ''}` })}
                            >
                              <option value="" disabled>Month</option>
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>
                              ))}
                            </select>
                            <select 
                              className={`form-select bg-light border-0 rounded-3 ${formErrors.expiryDate ? 'is-invalid' : ''}`}
                              value={paymentFormData.expiryDate.split('/')[1] || ''}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, expiryDate: `${paymentFormData.expiryDate.split('/')[0] || ''}/${e.target.value}` })}
                            >
                              <option value="" disabled>Year</option>
                              {Array.from({ length: 11 }, (_, i) => {
                                const yr = String(new Date().getFullYear() + i).slice(-2);
                                return <option key={yr} value={yr}>{2000 + parseInt(yr)}</option>;
                              })}
                            </select>
                          </div>
                          {formErrors.expiryDate && <div className="text-danger small mt-1">{formErrors.expiryDate}</div>}
                        </div>
                        <div className="col-4">
                          <div className="form-floating mt-4">
                            <input type="password" className={`form-control bg-light border-0 ${formErrors.cvv ? 'is-invalid' : ''}`} placeholder="CVV" value={paymentFormData.cvv} onChange={(e) => setPaymentFormData({...paymentFormData, cvv: e.target.value})} maxLength="4" />
                            <label>CVV</label>
                            {formErrors.cvv && <div className="invalid-feedback d-block">{formErrors.cvv}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'upi' && (
                    <div className="animate__animated animate__fadeIn">
                      <div className="form-floating mb-3">
                        <input type="tel" className={`form-control bg-light border-0 ${formErrors.phoneNumber ? 'is-invalid' : ''}`} placeholder="Phone" value={paymentFormData.phoneNumber} onChange={(e) => setPaymentFormData({...paymentFormData, phoneNumber: e.target.value})} />
                        <label>UPI Linked Phone Number</label>
                        {formErrors.phoneNumber && <div className="invalid-feedback d-block">{formErrors.phoneNumber}</div>}
                      </div>
                      <div className="alert alert-info small border-0 rounded-3"><FaShieldAlt className="me-2" /> You will receive a payment request on your UPI app.</div>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-pill mt-4 shadow-sm"
                    onClick={handlePaymentConfirm}
                    disabled={!selectedPaymentMethod}
                  >
                    Confirm & Pay ₹{priceCalculation.total.toLocaleString()}
                  </button>
                  <p className="text-center text-muted small mt-3 mb-0"><FaShieldAlt className="text-success me-1" /> Secure 256-bit SSL Encrypted Payment</p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="animate__animated animate__fadeIn text-center py-5">
                <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="fw-bold">Confirming Your Stay</h3>
                <p className="text-muted">We're finalizing your booking at {hotel?.name}. This will only take a moment.</p>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-lg rounded-4 position-sticky" style={{ top: '100px' }}>
              <div className="card-body">
                <h5 className="fw-bold mb-3">Booking Summary</h5>
                {hotel && <p className="mb-2"><strong>{hotel.name}</strong></p>}
                {room && <p className="text-muted mb-3">{room.type}</p>}
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>₹{(room?.price ?? room?.Price ?? 0).toLocaleString()} x {bookingSummary?.nights || 1} nights x {priceCalculation.numberOfRooms || 1} rooms:</span>
                  <span>₹{priceCalculation.base.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Tax (12%):</span>
                  <span>₹{priceCalculation.tax.toLocaleString()}</span>
                </div>
                  {priceCalculation.extrasTotal > 0 && (
                    <div className="d-flex justify-content-between mb-3 text-info">
                      <span>Add-ons & Extras:</span>
                      <span>+₹{priceCalculation.extrasTotal.toLocaleString()}</span>
                    </div>
                  )}
                {redemptionPointsUsed > 0 && (
                  <div className="d-flex justify-content-between mb-3 text-success">
                    <span>Redemption Discount:</span>
                    <span>-₹{redemptionPointsUsed.toLocaleString()}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{priceCalculation.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;
