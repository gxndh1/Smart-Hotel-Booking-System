import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { logout, updateUserProfile, fetchAccountData } from "../redux/authSlice";
import UserProfile from "../components/features/userDetails/UserProfile";
import UserBookings from "../components/features/userDetails/UserBookings";
import UserLoyalty from "../components/features/userDetails/UserLoyalty";
import { fetchUserLoyalty } from "../redux/loyaltySlice";
import { FaUser, FaTrophy, FaCalendar, FaBuilding, FaCog, FaSignOutAlt, FaChevronRight, FaChartBar } from "react-icons/fa";

const UserAccount = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const hasFetchedData = useRef(false);
  
  const auth = useSelector((state) => state.auth);
  const { user: currentUser, isAuthenticated, isInitialized, loading: authLoading } = auth;

  // Normalize role to lowercase for robust comparison
  const userRole = (currentUser?.role || currentUser?.Role || "guest").toLowerCase();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  // Handle tab query parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'bookings', 'loyalty'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Refresh loyalty data when the loyalty tab is selected
  useEffect(() => {
    if (activeTab === 'loyalty' && isAuthenticated && !loading) {
      dispatch(fetchUserLoyalty());
    }
  }, [activeTab, isAuthenticated, dispatch]);

  // Sync form data when currentUser changes (e.g. after loadUserData updates Redux)
  useEffect(() => {
    // Only sync if not in edit mode to prevent overwriting user input during background refreshes
    if (currentUser && !isEditMode) {
      setFormData({
        name: currentUser.name || currentUser.Name || "",
        email: currentUser.email || currentUser.Email || "",
        phone: currentUser.contactNumber || currentUser.ContactNumber || currentUser.phone || "",
        address: currentUser.address || currentUser.Address || "",
        city: currentUser.city || currentUser.City || "",
        country: currentUser.country || currentUser.Country || "",
      });
    }
  }, [currentUser, isEditMode]);

  // Load data once on mount or when auth status changes
  useEffect(() => {
    // Only fetch if authenticated, initialized, and not already fetched in this mount cycle.
    // Also check if bookings are already present to avoid redundant calls.
    if (isAuthenticated && isInitialized && !hasFetchedData.current && bookings.length === 0) {
      loadUserData();
      hasFetchedData.current = true;
    }
  }, [isAuthenticated, isInitialized, dispatch, bookings.length]);

  const loadUserData = async () => {
    setLoading(true);
    dispatch(fetchAccountData())
      .unwrap()
      .then((data) => {
        setBookings(data.bookings || []);
      })
      .catch((err) => {
        console.error("Error loading user data:", err);
      })
      .finally(() => setLoading(false));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const profileData = {
      name: formData.name,
      contactNumber: formData.phone,
      address: formData.address,
      city: formData.city,
      country: formData.country
    };

    dispatch(updateUserProfile(profileData))
      .unwrap()
      .then(() => {
        setEditSuccess(true);
        setIsEditMode(false);
        setTimeout(() => setEditSuccess(false), 3000);
        loadUserData();
      })
      .catch((err) => {
        alert(err || 'Failed to update profile');
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/", { replace: true });
  };

  const getTabs = () => {
    switch(userRole) {
      case "manager":
        return ["profile", "manage-bookings"];
      case "admin":
        return ["profile"];
      case "guest":
      default:
        return ["profile", "bookings", "loyalty"];
    }
  };

  const availableTabs = getTabs();

  // Show spinner only during initial app initialization.
  // Component-level data fetching (loading) is handled within the tabs to prevent full-page flickering.
  if (!isInitialized) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <NavBar />
        <div className="container py-5 text-center">
          <h4 className="text-muted">Loading your account...</h4>
          <div className="spinner-border text-primary mt-3"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle case where auth passed but user data is missing after loading
  if (!currentUser && isInitialized) {
    return (
      <div className="bg-light min-vh-100 d-flex flex-column">
        <NavBar />
        <div className="container py-5 text-center">
          <div className="alert alert-warning d-inline-block px-5 py-4 rounded-4 shadow-sm">
            <h4 className="fw-bold">Session Sync Issue</h4>
            <p className="mb-3">We couldn't retrieve your profile details. Please try logging in again.</p>
            <button onClick={handleLogout} className="btn btn-primary rounded-pill px-4">Sign In Again</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
      <NavBar />

      <nav className="bg-white border-bottom py-3">
        <div className="container">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <Link to={userRole === 'admin' ? '/admin' : userRole === 'manager' ? '/manager' : '/'} className="text-decoration-none">
                {userRole === 'guest' ? 'Home' : 'Dashboard'}
              </Link>
            </li>
            <li className="breadcrumb-item active fw-bold text-dark">My Account</li>
          </ol>
        </div>
      </nav>

      <main className="container py-5 flex-grow-1">
        <div className="mb-5 animate__animated animate__fadeIn">
          <h1 className="fw-bold text-dark mb-1">Welcome back, {currentUser?.name?.split(' ')[0] || 'Guest'}!</h1>
          <p className="text-muted">Manage your profile, track your bookings, and check your rewards.</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-3">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden sticky-top" style={{ top: '100px' }}>
              <div className="p-4 text-center border-bottom bg-light bg-opacity-50">
                <div className="position-relative d-inline-block mb-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px' }}>
                    <span className="fs-2 fw-bold text-primary">{currentUser?.name?.charAt(0) || 'U'}</span>
                  </div>
                  <button className="btn btn-white btn-sm rounded-circle position-absolute bottom-0 end-0 shadow-sm border p-1" style={{ width: '28px', height: '28px' }}>
                    <FaCog size={14} className="text-muted" />
                  </button>
                </div>
                <h5 className="fw-bold mb-0 text-dark">{currentUser?.name || 'User'}</h5>
                <p className="small text-muted mb-2">{currentUser?.email}</p>
                <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                  {userRole.toUpperCase()}
                </span>
              </div>

              <div className="p-3">
                {userRole !== 'guest' && (
                  <button
                    onClick={() => navigate(userRole === 'admin' ? '/admin' : '/manager')}
                    className="btn btn-outline-primary w-100 text-start d-flex align-items-center py-3 px-3 mb-2 rounded-3 border-0"
                  >
                    <FaChartBar className="me-3" />
                    <span className="fw-bold">Back to Dashboard</span>
                  </button>
                )}

                {availableTabs.includes("profile") && (
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all ${activeTab === "profile" ? "btn-primary shadow-sm" : "btn-light border-0 text-muted"}`}
                  >
                    <span><FaUser className="me-3" /> Profile</span>
                    {activeTab === "profile" && <FaChevronRight size={12} />}
                  </button>
                )}
                
                {availableTabs.includes("manage-bookings") && (
                  <button
                    onClick={() => navigate('/manager', { state: { activeTab: 'bookings' } })}
                    className="btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all btn-light border-0 text-muted"
                  >
                    <span><FaBuilding className="me-3" /> Manage Bookings</span>
                    <FaChevronRight size={12} />
                  </button>
                )}
                
                {availableTabs.includes("bookings") && (
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all ${activeTab === "bookings" ? "btn-primary shadow-sm" : "btn-light border-0 text-muted"}`}
                  >
                    <span><FaCalendar className="me-3" /> My Bookings</span>
                    {activeTab === "bookings" && <FaChevronRight size={12} />}
                  </button>
                )}
                
                {availableTabs.includes("loyalty") && (
                  <button
                    onClick={() => setActiveTab("loyalty")}
                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all ${activeTab === "loyalty" ? "btn-primary shadow-sm" : "btn-light border-0 text-muted"}`}
                  >
                    <span><FaTrophy className="me-3" /> Loyalty Points</span>
                    {activeTab === "loyalty" && <FaChevronRight size={12} />}
                  </button>
                )}

                {availableTabs.includes("users") && (
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all ${activeTab === "users" ? "btn-primary shadow-sm" : "btn-light border-0 text-muted"}`}
                  >
                    <span><FaUser className="me-3" /> User Details</span>
                  </button>
                )}

                {availableTabs.includes("hotels") && (
                  <button
                    onClick={() => setActiveTab("hotels")}
                    className={`btn w-100 text-start d-flex align-items-center justify-content-between py-3 px-3 mb-2 rounded-3 transition-all ${activeTab === "hotels" ? "btn-primary shadow-sm" : "btn-light border-0 text-muted"}`}
                  >
                    <span><FaBuilding className="me-3" /> Hotel Details</span>
                  </button>
                )}

                <div className="mt-4 pt-3 border-top">
                  <button 
                    onClick={handleLogout}
                    className="btn btn-link text-danger text-decoration-none w-100 text-start px-3 py-2 d-flex align-items-center gap-2"
                  >
                    <FaSignOutAlt size={14} /> <span className="small fw-bold">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {editSuccess && (
              <div className="alert alert-success border-0 shadow-sm rounded-4 alert-dismissible fade show mb-4" role="alert">
                <strong>Success!</strong> Your profile has been updated.
                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="animate__animated animate__fadeIn"><UserProfile 
                currentUser={currentUser}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSaveProfile={handleSaveProfile}
                editSuccess={editSuccess}
                loading={loading}
              /></div>
            )}

            {activeTab === "bookings" && (
              <div className="animate__animated animate__fadeIn"><UserBookings 
                bookings={bookings} 
                loading={loading}
                onBookingCancelled={() => loadUserData()}
              /></div>
            )}

            {activeTab === "loyalty" && (
              <div className="animate__animated animate__fadeIn"><UserLoyalty currentUser={currentUser} /></div>
            )}

            {activeTab === "users" && userRole === "admin" && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-4">User Management</h4>
                  <p className="text-muted">Manage system users and their roles.</p>
                </div>
              </div>
            )}

            {activeTab === "hotels" && userRole === "admin" && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-4">Hotel Management</h4>
                  <p className="text-muted">Manage hotel properties and their details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserAccount;
