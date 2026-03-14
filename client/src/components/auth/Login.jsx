import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTimes, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { loginUser } from "../../redux/authSlice";

const Login = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const from = location.state?.from?.pathname || location.state?.redirectTo;
  const messageFromState = location?.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    dispatch(loginUser({ email, password }))
      .unwrap()
      .then((data) => {
        const { user } = data;
        if (onSuccess) onSuccess();
        
        const normalizedRole = (user.role || user.Role || 'guest').toLowerCase();
        
        if (from) {
          navigate(from, { replace: true });
        } else if (normalizedRole === "admin") {
          navigate("/admin");
        } else if (normalizedRole === "manager") {
          navigate("/manager");
        } else {
          navigate("/");
        }
      })
      .catch((err) => {
        setError(err || "Login failed. Please check your credentials.");
        setLoading(false);
      });
  };

  const handleRegisterClick = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      navigate('/register');
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
            padding: 20px;
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
            width: 400px;
            height: 400px;
            background: rgba(56, 189, 248, 0.4);
            top: -100px;
            left: -100px;
            animation-delay: 0s;
          }
          .orb-2 {
            width: 500px;
            height: 500px;
            background: rgba(139, 92, 246, 0.4);
            bottom: -150px;
            right: -100px;
            animation-delay: -5s;
          }
          .orb-3 {
            width: 300px;
            height: 300px;
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
            max-width: 440px;
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
          .stagger-1 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) O.2s both; animation-delay: 0.1s; }
          .stagger-2 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both; animation-delay: 0.2s; }
          .stagger-3 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both; animation-delay: 0.3s; }
          .stagger-4 { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both; animation-delay: 0.4s; }

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

          /* Animated Inputs */
          .auth-input-group {
            position: relative;
            margin-bottom: 24px;
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
          
          .auth-input {
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
          }

          /* Floating Label Logic */
          .auth-input:focus ~ .auth-label,
          .auth-input:not(:placeholder-shown) ~ .auth-label {
            transform: translateY(-12px) scale(0.85);
            transform-origin: left top;
            color: #38bdf8;
          }

          .auth-input-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
            transition: all 0.3s ease;
            font-size: 18px;
          }

          .auth-input:focus {
            background: rgba(15, 23, 42, 0.9);
            border-color: #38bdf8;
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
          }
          .auth-input:focus ~ .auth-input-icon {
            color: #38bdf8;
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
            background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%);
            color: #ffffff;
            border: none;
            border-radius: 16px;
            padding: 16px;
            width: 100%;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            margin-top: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
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
          }
          @keyframes shine {
            0% { left: -100%; }
            20% { left: 200%; }
            100% { left: 200%; }
          }

          .auth-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 12px 25px rgba(139, 92, 246, 0.4);
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
            color: #38bdf8;
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
            background-color: #38bdf8;
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
            margin-bottom: 24px;
            text-align: center;
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
          .auth-info {
            background: rgba(56, 189, 248, 0.15);
            border: 1px solid rgba(56, 189, 248, 0.3);
            color: #7dd3fc;
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            margin-bottom: 24px;
            text-align: center;
          }
          
          /* Spinner for loading state */
          .spinner {
            animation: rotate 2s linear infinite;
            z-index: 2;
            width: 20px;
            height: 20px;
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
            <h2>Welcome Back</h2>
            <p>Enter your details to access your account</p>
          </div>

          {messageFromState && <div className="auth-info stagger-2">{messageFromState}</div>}
          {error && <div className="auth-alert stagger-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-input-group stagger-2">
              <input
                type="email"
                placeholder=" "
                autoComplete="username"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label className="auth-label">Email Address</label>
              <FaEnvelope className="auth-input-icon" />
            </div>

            <div className="auth-input-group stagger-3">
              <input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                autoComplete="current-password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="stagger-4">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                ) : (
                  <>
                    Sign In <FaSignInAlt size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer stagger-4">
            Don't have an account? 
            <button
              type="button"
              onClick={handleRegisterClick}
              className="auth-link"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
