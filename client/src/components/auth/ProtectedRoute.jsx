import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, isInitialized } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // FIXED: Use only lowercase 'role' - consistent with backend data model
  const role = (user?.role || user?.Role || 'guest').toLowerCase();

  try {
    // 1. Show spinner only before first initialization (initial checkAuth).
    // IMPORTANT: Do NOT use the 'loading' flag here. It triggers on every background API call,
    // causing the protected component to unmount and remount, creating infinite request loops.
    if (!isInitialized) {
      return (
        <div className="vh-100 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      );
    }

    // 2. If not logged in, send to login page
    // We save the 'referrer' location so we can send them back after they login
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2.5 If authenticated but user object is missing (sync error)
    if (isAuthenticated && !user) {
      console.warn("[ProtectedRoute] Authenticated but user object is missing. Redirecting to login.");
      return <Navigate to="/login" state={{ from: location, message: "Session expired. Please login again." }} replace />;
    }

    // 3. If logged in but doesn't have the right role (e.g., Guest trying to see Admin)
    // Normalize allowed roles to lowercase
    const normalizedAllowedRoles = allowedRoles?.map(r => r.toLowerCase()) || [];
    if (allowedRoles && allowedRoles.length > 0 && !normalizedAllowedRoles.includes(role)) {
      return (
        <Navigate
          to="/"
          state={{ message: "You do not have permission to view this page." }}
          replace
        />
      );
    }

    // 4. Everything is fine, show the page
    return children;
  } catch (error) {
    console.error("Auth Guard Error:", error);
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
