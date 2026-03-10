import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import Footer from "../components/layout/Footer";
import {
  fetchManagerStats,
  fetchManagerHotels,
  fetchManagerRooms,
  fetchManagerBookings,
  fetchManagerReviews,
  deleteManagerHotel,
  deleteManagerRoom,
  updateManagerBookingStatus,
  deleteManagerReview,
  selectManagerStats,
  selectManagerHotels,
  selectManagerRooms,
  selectManagerBookings,
  selectManagerReviews,
  selectManagerLoading,
  selectManagerError,
} from "../redux/managerSlice";
import { FaBuilding, FaBed, FaCalendarCheck, FaStar, FaChartBar } from "react-icons/fa";
import AddRoomForm from "../components/features/manager/AddRoomForm";
import ManagerStats from "../components/features/manager/ManagerStats";
import ManagerBookingTable from "../components/features/manager/ManagerBookingTable";
import { respondToReview } from "../redux/reviewSlice";
import DashboardHeader from "../components/common/dashboards/DashboardHeader";
import DashboardTabs from "../components/common/dashboards/DashboardTabs";
import DashboardSearch from "../components/common/dashboards/DashboardSearch";
import ManagerHotelSection from "../components/features/manager/ManagerHotelSection";
import ManagerRoomSection from "../components/features/manager/ManagerRoomSection";
import ManagerBookingSection from "../components/features/manager/ManagerBookingSection";
import ManagerReviewSection from "../components/features/manager/ManagerReviewSection";

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const stats = useSelector(selectManagerStats);
  const hotels = useSelector(selectManagerHotels);
  const rooms = useSelector(selectManagerRooms);
  const bookings = useSelector(selectManagerBookings);
  const reviews = useSelector(selectManagerReviews);
  const loading = useSelector(selectManagerLoading);
  const error = useSelector(selectManagerError);
  const auth = useSelector((state) => state.auth);

  // Get user role
  const rawRole = auth?.user?.role || sessionStorage.getItem('userRole');
  const userRole = rawRole?.toLowerCase();

  // Fetch data on mount
  useEffect(() => {
    if (userRole === 'manager' || userRole === 'admin') {
      loadData();
    }
  }, [dispatch, userRole]);

  // Redirect if not a manager
  useEffect(() => {
    if (userRole && userRole !== 'manager' && userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, navigate]);

  const loadData = () => {
    dispatch(fetchManagerStats());
    dispatch(fetchManagerHotels());
    dispatch(fetchManagerRooms());
    dispatch(fetchManagerBookings());
    dispatch(fetchManagerReviews());
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

  // Filtered data
  const filteredHotels = filterBySearch(hotels, ["name", "location"]);
  const filteredRooms = filterBySearch(rooms, ["type", "hotelId"]);
  const filteredBookings = filterBySearch(bookings, ["hotelName", "userName", "userEmail"]);
  const filteredReviews = filterBySearch(reviews, ["hotelName", "userName"]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm("Are you sure you want to delete this hotel? All rooms and bookings will also be deleted.")) {
      dispatch(deleteManagerHotel(hotelId))
        .then(() => {
          alert("Hotel deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete hotel");
        });
    }
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      dispatch(deleteManagerRoom(roomId))
        .then(() => {
          alert("Room deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete room");
        });
    }
  };

  const handleApproveBooking = (bookingId) => {
    dispatch(updateManagerBookingStatus({ bookingId, status: "confirmed" }))
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
      dispatch(updateManagerBookingStatus({ bookingId, status: "cancelled" }))
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
      dispatch(deleteManagerReview(reviewId))
        .then(() => {
          alert("Review deleted successfully");
          loadData();
        })
        .catch((err) => {
          alert(err.message || "Failed to delete review");
        });
    }
  };

  const handleReplyReview = (reviewId, managerReply) => {
    dispatch(respondToReview({ reviewId, managerReply }))
      .then(() => {
        alert("Reply posted successfully");
        loadData();
      })
      .catch((err) => {
        alert(err.message || "Failed to post reply");
      });
  };

  const tabs = [
    { id: "dashboard", icon: <FaChartBar />, label: "Dashboard" },
    { id: "hotels", icon: <FaBuilding />, label: "Hotels" },
    { id: "rooms", icon: <FaBed />, label: "Rooms" },
    { id: "bookings", icon: <FaCalendarCheck />, label: "Bookings" },
    { id: "reviews", icon: <FaStar />, label: "Reviews" },
  ];

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1" style={{ backgroundColor: "#f8f9fa", paddingTop: "20px", paddingBottom: "40px" }}>
        <div className="container">
          {/* Header */}
          <DashboardHeader 
            title="Manager Dashboard"
            subtitle="Manage your hotels and monitor bookings"
            icon={FaChartBar}
            onAccountClick={() => navigate('/account')}
            onLogoutClick={handleLogout}
          />

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
                  <h5 className="fw-bold mb-4 text-dark">Business Overview</h5>
                  <ManagerStats stats={stats} />
                  
                  <div className="mt-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0 text-dark">Recent Bookings</h5>
                      <button className="btn btn-link text-primary text-decoration-none fw-bold" onClick={() => setActiveTab("bookings")}>View All</button>
                    </div>
                    <ManagerBookingTable 
                      bookings={(filteredBookings || []).slice(0, 5)} 
                      onApprove={handleApproveBooking} 
                      onReject={handleRejectBooking} 
                    />
                  </div>
                </>
              )}

              {!loading && activeTab === "hotels" && (
                <ManagerHotelSection 
                  hotels={filteredHotels}
                  onAddHotel={() => navigate('/add-hotel')}
                  onDeleteHotel={handleDeleteHotel}
                />
              )}

              {!loading && activeTab === "rooms" && (
                <ManagerRoomSection 
                  rooms={filteredRooms}
                  hotels={hotels}
                  onAddRoom={() => setShowAddRoomModal(true)}
                  onDeleteRoom={handleDeleteRoom}
                />
              )}

              {!loading && activeTab === "bookings" && (
                <ManagerBookingSection 
                  bookings={filteredBookings}
                  onApprove={handleApproveBooking}
                  onReject={handleRejectBooking}
                />
              )}

              {!loading && activeTab === "reviews" && (
                <ManagerReviewSection 
                  reviews={filteredReviews}
                  onDelete={handleDeleteReview}
                  onReply={handleReplyReview}
                />
              )}
            </div>
          </div>

          {/* Add Room Modal */}
          {showAddRoomModal && (
            <AddRoomForm 
              hotels={hotels} 
              onClose={() => setShowAddRoomModal(false)}
              onSuccess={() => {
                setShowAddRoomModal(false);
                loadData();
              }}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ManagerDashboard;
