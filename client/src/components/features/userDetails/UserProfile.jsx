import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../redux/authSlice";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaCalendarAlt, FaGlobe, FaCity, FaLock, FaKey, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5600';

const UserProfile = ({ 
  currentUser, 
  isEditMode, 
  setIsEditMode, 
  formData, 
  handleInputChange, 
  handleSaveProfile,
  editSuccess,
  loading = false
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!isForgotMode && !passwordData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (passwordData.newPassword.length < 8) newErrors.newPassword = "New password must be at least 8 characters";
    if (!isForgotMode && passwordData.newPassword === passwordData.currentPassword) newErrors.newPassword = "New password cannot be the same as current";
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: isForgotMode ? undefined : passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
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
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordForm(false);
          setIsForgotMode(false);
        }, 3000);
      } else {
        setPasswordErrors({ server: data.message || "Failed to change password" });
      }
    } catch (error) {
      setPasswordErrors({ server: "Error connecting to server" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (window.confirm("Have you forgotten your password?")) {
      setIsForgotMode(true);
      setShowPasswordForm(true);
      setPasswordErrors({});
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeIn">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
              <FaUser className="text-primary fs-4" />
            </div>
            <div>
              <h4 className="fw-bold mb-0">Profile Information</h4>
              <p className="text-muted small mb-0">Manage your personal details</p>
            </div>
          </div>
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
            >
              <FaEdit className="me-2" />
              Edit Profile
            </button>
          )}
        </div>

        {editSuccess && (
          <div className="alert alert-success border-0 shadow-sm rounded-3 alert-dismissible fade show mb-4" role="alert">
            <strong><FaSave className="me-2" />Success!</strong> Your profile has been updated.
            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
          </div>
        )}

        {isEditMode ? (
          <form className="animate__animated animate__fadeIn">
            <div className="row g-4">
              <div className="col-12">
                <div className="form-floating">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="nameInput"
                    placeholder="Full Name"
                  />
                  <label htmlFor="nameInput" className="fw-bold small text-muted">Full Name</label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="emailInput"
                    placeholder="Email"
                    disabled
                  />
                  <label htmlFor="emailInput" className="fw-bold small text-muted">Email</label>
                  <small className="text-muted">Email cannot be changed</small>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="phoneInput"
                    placeholder="Phone"
                  />
                  <label htmlFor="phoneInput" className="fw-bold small text-muted">Phone Number</label>
                </div>
              </div>
              <div className="col-12">
                <div className="form-floating">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="addressInput"
                    placeholder="Address"
                  />
                  <label htmlFor="addressInput" className="fw-bold small text-muted">Address</label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="cityInput"
                    placeholder="City"
                  />
                  <label htmlFor="cityInput" className="fw-bold small text-muted">City</label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="form-control rounded-3"
                    id="countryInput"
                    placeholder="Country"
                  />
                  <label htmlFor="countryInput" className="fw-bold small text-muted">Country</label>
                </div>
              </div>
            </div>
            <div className="mt-4 d-flex gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="btn btn-primary rounded-pill px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="btn btn-outline-secondary rounded-pill px-4"
                disabled={loading}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="row g-4">
            {[
              { icon: <FaUser />, label: "Full Name", value: currentUser?.name || currentUser?.Name || 'N/A' },
              { icon: <FaEnvelope />, label: "Email Address", value: currentUser?.email || currentUser?.Email || 'N/A' },
              { icon: <FaPhone />, label: "Phone Number", value: currentUser?.contactNumber || currentUser?.ContactNumber || currentUser?.phone || "Not provided" },
              { icon: <FaMapMarkerAlt />, label: "Address", value: currentUser?.address || currentUser?.Address || "Not provided" },
              { icon: <FaCity />, label: "City", value: currentUser?.city || currentUser?.City || "Not provided" },
              { icon: <FaGlobe />, label: "Country", value: currentUser?.country || currentUser?.Country || "Not provided" },
              { icon: <FaCalendarAlt />, label: "Account Created", value: currentUser?.createdAt ? formatDate(currentUser.createdAt) : "N/A" }
            ].map((item, idx) => (
              <div key={idx} className="col-md-6">
                <div className="p-3 rounded-4 border bg-light bg-opacity-25 h-100 transition-all shadow-hover">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
                      {item.icon}
                    </div>
                    <label className="fw-bold small text-muted mb-0">{item.label}</label>
                  </div>
                  <p className="ms-5 mb-0 fw-bold text-dark text-break">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security Section */}
        <div className="mt-5 pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <div className="bg-dark bg-opacity-10 p-3 rounded-3 me-3">
                <FaShieldAlt className="text-dark fs-4" />
              </div>
              <div>
                <h5 className="fw-bold mb-0">Security Settings</h5>
                <p className="text-muted small mb-0">Update your password and account security</p>
              </div>
            </div>
          </div>

          {passwordSuccess && (
            <div className="alert alert-success border-0 shadow-sm rounded-3 mb-4 animate__animated animate__fadeIn">
              <FaCheckCircle className="me-2" /> Password updated successfully!
            </div>
          )}

          {!showPasswordForm ? (
            <div className="d-flex flex-wrap gap-3">
              <button 
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-outline-dark rounded-pill px-4 fw-bold"
              >
                <FaKey className="me-2" /> Change Password
              </button>
              <button 
                onClick={handleForgotPassword}
                className="btn btn-link text-muted text-decoration-none small"
              >
                Forgot current password?
              </button>
            </div>
          ) : (
            <div className="card border-0 bg-light bg-opacity-50 rounded-4 p-4 animate__animated animate__fadeIn">
              <form onSubmit={handlePasswordSubmit}>
                <div className="row g-3">
                  {passwordErrors.server && (
                    <div className="col-12">
                      <div className="alert alert-danger py-2 small border-0 shadow-sm">
                        {passwordErrors.server}
                      </div>
                    </div>
                  )}
                  {!isForgotMode && (
                    <div className="col-md-4">
                      <div className="form-floating">
                        <input
                          type="password"
                          name="currentPassword"
                          className={`form-control border-0 shadow-sm ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                          placeholder="Current Password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordInputChange}
                        />
                        <label className="small fw-bold text-muted">Current Password</label>
                        {passwordErrors.currentPassword && <div className="invalid-feedback small">{passwordErrors.currentPassword}</div>}
                      </div>
                    </div>
                  )}
                  <div className="col-md-4">
                    <div className="form-floating">
                      <input
                        type="password"
                        name="newPassword"
                        className={`form-control border-0 shadow-sm ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                        placeholder="New Password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                      />
                      <label className="small fw-bold text-muted">New Password</label>
                      {passwordErrors.newPassword && <div className="invalid-feedback small">{passwordErrors.newPassword}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-floating">
                      <input
                        type="password"
                        name="confirmPassword"
                        className={`form-control border-0 shadow-sm ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                      />
                      <label className="small fw-bold text-muted">Confirm New Password</label>
                      {passwordErrors.confirmPassword && <div className="invalid-feedback small">{passwordErrors.confirmPassword}</div>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-dark rounded-pill px-4 fw-bold"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setIsForgotMode(false);
                    }}
                    className="btn btn-light rounded-pill px-4"
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
