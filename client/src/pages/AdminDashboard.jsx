import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import Footer from "../components/layout/Footer";
import {
  fetchDashboardStats,
  fetchAdminUsers,
  fetchAdminHotels,
  fetchAdminBookings,
  fetchMostBookedHotels,
  fetchAdminReviews,
  deleteUser,
  deleteHotel,
  updateAdminBookingStatus,
  updateUserRole,
  deleteReview,
  selectAdminStats,
  selectCustomers,
  selectManagers,
  selectAdmins,
  selectAdminHotels,
  selectAdminBookings,
  selectMostBookedHotels,
  selectAdminReviews,
  selectAdminLoading,
  selectAdminError,
} from "../redux/adminSlice";
import { FaUsers, FaUserTie, FaHotel, FaStar, FaChartBar, FaCalendarCheck, FaClipboardList, FaSync } from "react-icons/fa";
import DashboardHeader from "../components/common/dashboards/DashboardHeader";
import DashboardTabs from "../components/common/dashboards/DashboardTabs";
import DashboardSearch from "../components/common/dashboards/DashboardSearch";
import AdminStats from "../components/features/admin/AdminStats";
import AdminUserSection from "../components/features/admin/AdminUserSection";
import AdminHotelSection from "../components/features/admin/AdminHotelSection";
import AdminBookingSection from "../components/features/admin/AdminBookingSection";
import AdminReviewSection from "../components/features/admin/AdminReviewSection";
import AdminAnalyticsSection from "../components/features/admin/AdminAnalyticsSection";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const stats = useSelector(selectAdminStats);
  const customers = useSelector(selectCustomers);
  const managers = useSelector(selectManagers);
  const admins = useSelector(selectAdmins);
  const hotels = useSelector(selectAdminHotels);
  const bookings = useSelector(selectAdminBookings);
  const mostBookedHotels = useSelector(selectMostBookedHotels);
  const reviews = useSelector(selectAdminReviews);
  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const auth = useSelector((state) => state.auth);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, [dispatch]);

  // Handle errors from the backend
  useEffect(() => {
    if (error) {
      console.error("Admin Dashboard Error:", error);
    }
  }, [error]);

  const loadData = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchAdminUsers());
    dispatch(fetchAdminHotels());
    dispatch(fetchAdminBookings());
    dispatch(fetchMostBookedHotels());
    dispatch(fetchAdminReviews());
  };

  // Filter helpers
  const filterBySearch = (data, searchFields) => {
    if (!searchTerm) return data || [];
    const search = searchTerm.toLowerCase();
    return (data || []).filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(val => val && val.toString().toLowerCase().includes(search));
        }
        return value && value.toString().toLowerCase().includes(search);
      })
    );
  };

  const filteredCustomers = filterBySearch(customers, ["name", "email"]);
  const filteredManagers = filterBySearch(managers, ["name", "email"]);
  const filteredAdmins = filterBySearch(admins, ["name", "email"]);
  const filteredHotels = filterBySearch(hotels, ["name", "location"]);
  const filteredBookings = filterBySearch(bookings, ["hotelName", "userName", "userEmail", "bookingId"]);
  const filteredReviews = filterBySearch(reviews, ["hotelName", "userName"]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      dispatch(deleteUser(userId))
        .then(() => {
          alert("User deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete user");
        });
    }
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm("Are you sure you want to delete this hotel? All rooms and bookings will also be deleted.")) {
      dispatch(deleteHotel(hotelId))
        .then(() => {
          alert("Hotel deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete hotel");
        });
    }
  };

  const handleApproveBooking = (bookingId) => {
    dispatch(updateAdminBookingStatus({ bookingId, status: "confirmed" }))
      .then(() => {
        alert("Booking approved successfully");
        loadData();
      })
      .catch((err) => {
        alert(err.message || "Failed to approve booking");
      });
  };

  const handleRejectBooking = (bookingId) => {
    if (window.confirm("Are you sure you want to reject this booking?")) {
      dispatch(updateAdminBookingStatus({ bookingId, status: "cancelled" }))
        .then(() => {
          alert("Booking rejected successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to reject booking");
        });
    }
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      dispatch(deleteReview(reviewId))
        .then(() => {
          alert("Review deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete review");
        });
    }
  };

  const handleRoleChange = (userId, newRole) => {
    dispatch(updateUserRole({ userId, role: newRole }))
      .then(() => {
        alert("User role updated successfully");
        loadData();
      })
      .catch((err) => {
        alert(err.message || "Failed to update role");
      });
  };

  const tabs = [
    { id: "dashboard", icon: <FaChartBar />, label: "Overview" },
    { id: "customers", icon: <FaUsers />, label: "Customers" },
    { id: "managers", icon: <FaUserTie />, label: "Managers" },
    { id: "admins", icon: <FaStar />, label: "Admins" },
    { id: "hotels", icon: <FaHotel />, label: "Hotels" },
    { id: "bookings", icon: <FaCalendarCheck />, label: "Bookings" },
    { id: "reviews", icon: <FaClipboardList />, label: "Reviews" },
    { id: "analytics", icon: <FaChartBar />, label: "Analytics" },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1" style={{ backgroundColor: "#f8f9fa", paddingTop: "20px", paddingBottom: "40px" }}>
        <div className="container">
          {/* Header */}
          <div className="position-relative">
            <DashboardHeader 
              title="Admin Central Command"
              subtitle="Global oversight of users and property listings"
              icon={FaChartBar}
              onAccountClick={() => navigate('/account')}
              onLogoutClick={handleLogout}
            />
            <button 
              className="btn btn-sm btn-light position-absolute top-0 end-0 mt-2 me-2 rounded-circle shadow-sm d-none d-md-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', zIndex: 5 }}
              onClick={loadData}
              title="Refresh Data"
            >
              <FaSync className={loading ? 'fa-spin' : ''} />
            </button>
          </div>

          {/* Tab Navigation */}
          <DashboardTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => { setActiveTab(id); setSearchTerm(""); }}
          />

          {/* Search Bar */}
          <DashboardSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={`Search ${activeTab}...`}
          />

          {/* Content */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {!loading && activeTab === "dashboard" && (
                <>
                  <h5 className="fw-bold mb-4 text-dark">Dashboard Overview</h5>
                  <AdminStats stats={stats} />
                </>
              )}

              {!loading && activeTab === "customers" && (
                <AdminUserSection 
                  title="Registered Customers"
                  users={filteredCustomers}
                  type="customer"
                  onDelete={handleDeleteUser}
                  onRoleChange={handleRoleChange}
                />
              )}

              {!loading && activeTab === "managers" && (
                <AdminUserSection 
                  title="Hotel Managers"
                  users={filteredManagers}
                  type="manager"
                  onDelete={handleDeleteUser}
                  onRoleChange={handleRoleChange}
                />
              )}

              {!loading && activeTab === "admins" && (
                <AdminUserSection 
                  title="System Administrators"
                  users={filteredAdmins}
                  type="admin"
                  onDelete={handleDeleteUser}
                  onRoleChange={handleRoleChange}
                />
              )}

              {!loading && activeTab === "hotels" && (
                <AdminHotelSection 
                  hotels={filteredHotels}
                  onDelete={handleDeleteHotel}
                />
              )}

              {!loading && activeTab === "bookings" && (
                <AdminBookingSection 
                  bookings={filteredBookings}
                  onApprove={handleApproveBooking}
                  onReject={handleRejectBooking}
                />
              )}

              {!loading && activeTab === "reviews" && (
                <AdminReviewSection 
                  reviews={filteredReviews}
                  onDelete={handleDeleteReview}
                />
              )}

              {!loading && activeTab === "analytics" && (
                <AdminAnalyticsSection 
                  hotels={mostBookedHotels}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
