import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { registerUser } from "../../redux/authSlice";

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px", background: "#f9f9f9" },
  box: { position: "relative", backgroundColor: "#fff", padding: "30px 25px", borderRadius: "12px", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" },
  title: { marginBottom: "15px", color: "#000", fontSize: "28px", fontWeight: "bold" },
  label: { display: "block", marginBottom: "4px", fontWeight: "bold", color: "#333", fontSize: "13px", textAlign: "left" },
  input: { width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "12px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "16px", outline: "none" },
  button: { width: "100%", padding: "12px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" },
  text: { marginTop: "15px", color: "#000", fontSize: "14px" },
  linkBtn: { color: "#000", fontWeight: "bold", textDecoration: "none", background: "none", border: "none", cursor: "pointer", marginLeft: "5px", fontSize: "14px" },
  error: { color: "red", marginBottom: "10px", fontSize: "13px" },
  success: { color: "green", marginBottom: "10px", fontSize: "13px" },
  closeButton: { position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#333", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px" },
};

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirmPassword, role, contactNumber } = formData;

    if (!name || !email || !password || !confirmPassword || !contactNumber) {
      return setError("Please fill all fields");
    }

    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name)) {
      return setError("Name must contain only letters and spaces (minimum 2 characters)");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address");
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber.replace(/\D/g, ""))) {
      return setError("Contact number must be 10 digits");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 8) {
      return setError("Password cannot be less than 8 letters or number");
    }

    const payload = { name, email, password, confirmPassword, role, contactNumber };

    dispatch(registerUser(payload))
      .unwrap()
      .then(() => {
        setSuccess("User saved to Database successfully!");
        setTimeout(() => {
          onSwitchToLogin ? onSwitchToLogin() : navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        setError(err || "Registration failed");
      });
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <button onClick={() => navigate("/")} style={styles.closeButton}>
          <FaTimes />
        </button>

        <h2 style={styles.title}>Sign Up</h2>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Register As</label>
          <select name="role" style={styles.input} value={formData.role} onChange={handleChange}>
            <option value="guest">Guest User</option>
            <option value="manager">Hotel Manager</option>
          </select>

          <label style={styles.label}>Name</label>
          <input name="name" type="text" placeholder="Name" autoComplete="name" style={styles.input} onChange={handleChange} />

          <label style={styles.label}>Contact Number</label>
          <input name="contactNumber" type="text" placeholder="Contact Number" autoComplete="tel" style={styles.input} onChange={handleChange} />

          <label style={styles.label}>Email Id</label>
          <input name="email" type="email" placeholder="Email" autoComplete="email" style={styles.input} onChange={handleChange} />

          <label style={styles.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="new-password" style={styles.input} onChange={handleChange} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666"
              }}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <label style={styles.label}>Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" style={styles.input} onChange={handleChange} />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666"
              }}
            >
              {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          <button type="submit" style={styles.button}>Register</button>
        </form>

        <p style={styles.text}>
          Already have an account?
          <button type="button" onClick={onSwitchToLogin} style={styles.linkBtn}>Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;
