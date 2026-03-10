import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { loginUser } from "../../redux/authSlice";

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f4f4",
    padding: "20px",
  },
  box: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "40px 30px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "20px",
    color: "#000",
    fontSize: "28px",
    fontWeight: "bold",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#000",
    fontSize: "14px",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  text: { marginTop: "15px", color: "#666", fontSize: "14px" },
  linkBtn: {
    color: "#000",
    fontWeight: "bold",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    marginLeft: "5px",
  },
  error: { color: "red", marginBottom: "10px", fontSize: "14px" },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#333",
  },
};

const Login = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  // Check if user was redirected here from a protected route
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
        
        // FIXED: Check for both 'role' and 'Role' to ensure Managers are correctly identified
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
        setError(err || "Login failed. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <button onClick={() => navigate("/")} style={styles.closeButton}>
          <FaTimes />
        </button>
        <h2 style={styles.title}>Login</h2>
        {messageFromState && (
          <p style={{ color: "blue", marginBottom: "10px", fontSize: "14px" }}>
            {messageFromState}
          </p>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Email"
            autoComplete="username"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p style={styles.text}>
          Don't have an account?
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={styles.linkBtn}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
