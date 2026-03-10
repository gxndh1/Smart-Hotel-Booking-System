import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaLock, FaArrowLeft, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5600';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    contactNumber: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.newPassword.length < 8) {
      return setError('Password must be at least 8 characters long');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          contactNumber: formData.contactNumber,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light" style={{ backgroundColor: '#f8fafc' }}>
      <NavBar />
      <main className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeIn" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <FaShieldAlt className="text-primary fs-3" />
              </div>
              <h2 className="fw-bold text-dark">Reset Password</h2>
              <p className="text-muted">Verify your details to secure your account</p>
            </div>

            {success ? (
              <div className="text-center py-4 animate__animated animate__zoomIn">
                <FaCheckCircle className="text-success display-1 mb-3" />
                <h4 className="fw-bold">Success!</h4>
                <p className="text-muted">Your password has been updated. Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2 small border-0 shadow-sm mb-3">{error}</div>}
                
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    name="email"
                    className="form-control border-0 bg-light rounded-3"
                    id="emailInput"
                    placeholder="Email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <label htmlFor="emailInput" className="small fw-bold text-muted"><FaEnvelope className="me-2" />Email Address</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="tel"
                    name="contactNumber"
                    className="form-control border-0 bg-light rounded-3"
                    id="phoneInput"
                    placeholder="Contact Number"
                    required
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                  <label htmlFor="phoneInput" className="small fw-bold text-muted"><FaPhone className="me-2" />Contact Number</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    name="newPassword"
                    className="form-control border-0 bg-light rounded-3"
                    id="passInput"
                    placeholder="New Password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <label htmlFor="passInput" className="small fw-bold text-muted"><FaLock className="me-2" />New Password</label>
                </div>

                <div className="form-floating mb-4">
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control border-0 bg-light rounded-3"
                    id="confirmInput"
                    placeholder="Confirm Password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <label htmlFor="confirmInput" className="small fw-bold text-muted"><FaLock className="me-2" />Confirm Password</label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow-sm mb-3"
                  disabled={loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Reset Password'}
                </button>

                <div className="text-center">
                  <Link to="/login" className="text-decoration-none small fw-bold text-primary d-flex align-items-center justify-content-center gap-2">
                    <FaArrowLeft size={12} /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;