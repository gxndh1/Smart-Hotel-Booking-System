import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaPhoneAlt, FaUserTie, FaUserPlus } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { registerUser } from "../../redux/authSlice";

const Register = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    role: "guest",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { name, email, password, confirmPassword, role, contactNumber } = formData;

    if (!name || !email || !password || !confirmPassword || !contactNumber) {
      setLoading(false);
      return setError("Please fill all fields");
    }

    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name)) {
      setLoading(false);
      return setError("Name must contain only letters and spaces (minimum 2 characters)");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoading(false);
      return setError("Please enter a valid email address");
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber.replace(/\D/g, ""))) {
      setLoading(false);
      return setError("Contact number must be 10 digits");
    }

    if (password !== confirmPassword) {
      setLoading(false);
      return setError("Passwords do not match");
    }

    if (password.length < 8) {
      setLoading(false);
      return setError("Password cannot be less than 8 characters");
    }

    const payload = { name, email, password, confirmPassword, role, contactNumber };

    dispatch(registerUser(payload))
      .unwrap()
      .then(() => {
        setSuccess("Account created successfully!");
        setLoading(false);
        setTimeout(() => {
          if(onSwitchToLogin) onSwitchToLogin();
          else navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        setError(err || "Registration failed. Please try again.");
        setLoading(false);
      });
  };

  const handleLoginClick = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

          .auth-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            position: relative;
            padding: 40px 20px;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
          }

          /* Animated Background Orbs */
          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            z-index: 1;
            animation: float 20s infinite ease-in-out;
            opacity: 0.6;
          }
          .orb-1 {
            width: 450px;
            height: 450px;
            background: rgba(139, 92, 246, 0.4);
            top: -100px;
            left: -100px;
            animation-delay: 0s;
          }
          .orb-2 {
            width: 550px;
            height: 550px;
            background: rgba(56, 189, 248, 0.4);
            bottom: -150px;
            right: -100px;
            animation-delay: -5s;
          }
          .orb-3 {
            width: 350px;
            height: 350px;
            background: rgba(236, 72, 153, 0.3);
            top: 40%;
            left: 50%;
            animation-delay: -10s;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 48px 40px;
            width: 100%;
            max-width: 700px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            position: relative;
            z-index: 10;
            color: white;
            animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          }

          @keyframes cardEntrance {
            from { opacity: 0; transform: translateY(60px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* Staggered form items */
          .stagger-1 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both; }
          .stagger-2 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both; }
          .stagger-3 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both; }
          .stagger-4 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both; }
          .stagger-5 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both; }
          .stagger-6 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s both; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .auth-header {
            text-align: center;
            margin-bottom: 35px;
          }
          .auth-header h2 {
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -1px;
          }
          .auth-header p {
            color: #94a3b8;
            font-size: 16px;
            margin: 0;
            font-weight: 400;
          }

          .auth-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px 20px;
          }
          @media (min-width: 600px) {
            .auth-grid {
              grid-template-columns: 1fr 1fr;
            }
            .full-width {
              grid-column: 1 / -1;
            }
          }

          /* Animated Inputs */
          .auth-input-group {
            position: relative;
          }
          .auth-label {
            position: absolute;
            left: 48px;
            top: 16px;
            color: #94a3b8;
            font-size: 15px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            font-weight: 500;
          }
          
          .auth-input, .auth-select {
            width: 100%;
            background: rgba(15, 23, 42, 0.6);
            border: 2px solid transparent;
            border-radius: 16px;
            padding: 24px 16px 8px 46px; /* Space for floating label */
            color: #f8fafc;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            outline: none;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            font-family: inherit;
            appearance: none;
          }

          .auth-select option {
            background: #1e293b;
            color: white;
            padding: 10px;
          }

          /* Floating Label Logic */
          .auth-input:focus ~ .auth-label,
          .auth-input:not(:placeholder-shown) ~ .auth-label,
          .auth-select:focus ~ .auth-label,
          .auth-select:not([value="guest"]):not([value="manager"]) ~ .auth-label,
          .auth-select[value="guest"] ~ .auth-label,
          .auth-select[value="manager"] ~ .auth-label {
            transform: translateY(-12px) scale(0.85);
            transform-origin: left top;
            color: #8b5cf6;
          }

          .auth-input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
            transition: all 0.3s ease;
            font-size: 18px;
            pointer-events: none;
          }

          .auth-select-wrapper::after {
            content: '';
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            width: 0; 
            height: 0; 
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #64748b;
            pointer-events: none;
            transition: all 0.3s ease;
          }

          .auth-input:focus, .auth-select:focus {
            background: rgba(15, 23, 42, 0.9);
            border-color: #8b5cf6;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
          }
          .auth-input:focus ~ .auth-input-icon,
          .auth-select:focus ~ .auth-input-icon {
            color: #8b5cf6;
          }
          .auth-select:focus ~ .auth-select-wrapper::after {
            border-top-color: #8b5cf6;
          }

          .eye-btn {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .eye-btn:hover {
            color: #f8fafc;
            transform: translateY(-50%) scale(1.1);
          }

          .auth-btn {
            background: linear-gradient(135deg, #8b5cf6 0%, #38bdf8 100%);
            color: #ffffff;
            border: none;
            border-radius: 16px;
            padding: 16px;
            width: 100%;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3);
            font-family: inherit;
            position: relative;
            overflow: hidden;
          }
          
          /* Button Shine effect */
          .auth-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
            transform: skewX(-25deg);
            animation: shine 6s infinite;
            animation-delay: 1s;
          }
          @keyframes shine {
            0% { left: -100%; }
            20% { left: 200%; }
            100% { left: 200%; }
          }

          .auth-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 12px 25px rgba(56, 189, 248, 0.4);
          }
          .auth-btn:active:not(:disabled) {
            transform: translateY(1px);
          }
          .auth-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            background: #475569;
            box-shadow: none;
          }

          .auth-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 15px;
            color: #94a3b8;
            font-weight: 400;
          }
          .auth-link {
            color: #8b5cf6;
            font-weight: 600;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0 5px;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
          }
          .auth-link::after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 2px;
            bottom: -2px;
            left: 0;
            background-color: #8b5cf6;
            transform-origin: bottom right;
            transition: transform 0.3s ease-out;
          }
          .auth-link:hover::after {
            transform: scaleX(1);
            transform-origin: bottom left;
          }

          .auth-close {
            position: absolute;
            top: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .auth-close:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            border-color: rgba(239, 68, 68, 0.3);
            transform: rotate(90deg);
          }
          .auth-alert {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            margin-bottom: 8px;
            text-align: center;
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            grid-column: 1 / -1;
          }
          .auth-success {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #6ee7b7;
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            margin-bottom: 8px;
            text-align: center;
            grid-column: 1 / -1;
            animation: fadeUp 0.5s ease both;
          }
          
          /* Spinner for loading state */
          .spinner {
            animation: rotate 2s linear infinite;
            z-index: 2;
            width: 22px;
            height: 22px;
          }
          .spinner .path {
            stroke: #ffffff;
            stroke-linecap: round;
            animation: dash 1.5s ease-in-out infinite;
          }
          @keyframes rotate { 100% { transform: rotate(360deg); } }
          @keyframes dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
          }
        `}
      </style>

      <div className="auth-wrapper">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        
        <div className="glass-card">
          <button onClick={() => navigate("/")} className="auth-close" aria-label="Close">
            <FaTimes size={16} />
          </button>
          
          <div className="auth-header stagger-1">
            <h2>Create Account</h2>
            <p>Join us and start booking your perfect stay</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-grid">
            {error && <div className="auth-alert stagger-1">{error}</div>}
            {success && <div className="auth-success stagger-1">{success}</div>}

            <div className="auth-input-group auth-select-wrapper stagger-2">
              <select name="role" className="auth-select" value={formData.role} onChange={handleChange}>
                <option value="guest">Guest User</option>
                <option value="manager">Hotel Manager</option>
              </select>
              <label className="auth-label">Register As</label>
              <FaUserTie className="auth-input-icon" />
            </div>

            <div className="auth-input-group stagger-2">
              <input 
                name="name" 
                type="text" 
                placeholder=" " 
                autoComplete="name" 
                className="auth-input" 
                onChange={handleChange} 
                required
              />
              <label className="auth-label">Full Name</label>
              <FaUser className="auth-input-icon" />
            </div>

            <div className="auth-input-group stagger-3">
              <input 
                name="contactNumber" 
                type="text" 
                placeholder=" " 
                autoComplete="tel" 
                className="auth-input" 
                onChange={handleChange} 
                required
              />
              <label className="auth-label">Contact Number</label>
              <FaPhoneAlt className="auth-input-icon" />
            </div>

            <div className="auth-input-group stagger-3">
              <input 
                name="email" 
                type="email" 
                placeholder=" " 
                autoComplete="email" 
                className="auth-input" 
                onChange={handleChange} 
                required
              />
              <label className="auth-label">Email Address</label>
              <FaEnvelope className="auth-input-icon" />
            </div>

            <div className="auth-input-group stagger-4">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder=" " 
                autoComplete="new-password" 
                className="auth-input" 
                onChange={handleChange} 
                required
              />
              <label className="auth-label">Password</label>
              <FaLock className="auth-input-icon" />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <div className="auth-input-group stagger-4">
              <input 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder=" " 
                autoComplete="new-password" 
                className="auth-input" 
                onChange={handleChange} 
                required
              />
              <label className="auth-label">Confirm Password</label>
              <FaLock className="auth-input-icon" />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <div className="full-width stagger-5">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                ) : (
                  <>
                    Create Account <FaUserPlus size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer stagger-6">
            Already have an account? 
            <button type="button" onClick={handleLoginClick} className="auth-link">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
