import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../utils/api';


export const fetchDashboardStats = createAsyncThunk('admin/fetchDashboardStats', async () => {
  const response = await api.get('/admin/stats');
  return response.data.data;
});


export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async () => {
  const response = await api.get('/admin/users');
  return response.data.data;
});


export const fetchAdminHotels = createAsyncThunk('admin/fetchHotels', async () => {
  const response = await api.get('/admin/hotels');
  return response.data.data;
});


export const fetchAdminBookings = createAsyncThunk('admin/fetchBookings', async () => {
  const response = await api.get('/admin/bookings');
  return response.data.data;
});


export const fetchMostBookedHotels = createAsyncThunk('admin/fetchMostBooked', async () => {
  const response = await api.get('/admin/analytics/most-booked');
  return response.data.data;
});


export const fetchAdminReviews = createAsyncThunk('admin/fetchReviews', async () => {
  const response = await api.get('/admin/reviews');
  return response.data.data;
});


export const deleteUser = createAsyncThunk('admin/deleteUser', async (userId) => {
  await api.delete(`/admin/users/${userId}`);
  return userId;
});


export const deleteHotel = createAsyncThunk('admin/deleteHotel', async (hotelId) => {
  await api.delete(`/admin/hotels/${hotelId}`);
  return hotelId;
});


export const updateAdminBookingStatus = createAsyncThunk('admin/updateBookingStatus', async ({ bookingId, status }) => {
  const response = await api.put(`/admin/bookings/${bookingId}/status`, { status });
  return response.data.data;
});


export const updateUserRole = createAsyncThunk('admin/updateUserRole', async ({ userId, role }) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data.data;
});


export const deleteReview = createAsyncThunk('admin/deleteReview', async (reviewId) => {
  await api.delete(`/admin/reviews/${reviewId}`);
  return reviewId;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null,
    users: [],
    hotels: [],
    bookings: [],
    reviews: [],
    mostBookedHotels: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Hotels
      .addCase(fetchAdminHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = action.payload;
      })
      .addCase(fetchAdminHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Bookings
      .addCase(fetchAdminBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchAdminBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Most Booked Hotels
      .addCase(fetchMostBookedHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMostBookedHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.mostBookedHotels = action.payload;
      })
      .addCase(fetchMostBookedHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Reviews
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      })
      
      // Delete Hotel
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.hotels = state.hotels.filter(h => h._id !== action.payload);
      })
      
      // Update Booking Status
      .addCase(updateAdminBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      
      // Update User Role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      // Delete Review
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r._id !== action.payload);
      });
  }
});

export const { clearError } = adminSlice.actions;

// Selectors
export const selectAdminStats = (state) => state.admin?.stats;
export const selectAdminUsers = (state) => state.admin?.users || [];

export const selectCustomers = createSelector(
  [selectAdminUsers],
  (users) => users.filter(u => (u.role || '').toLowerCase() === 'guest')
);

export const selectManagers = createSelector(
  [selectAdminUsers],
  (users) => users.filter(u => (u.role || '').toLowerCase() === 'manager')
);

export const selectAdmins = createSelector(
  [selectAdminUsers],
  (users) => users.filter(u => (u.role || '').toLowerCase() === 'admin')
);

export const selectAdminHotels = (state) => state.admin?.hotels || [];
export const selectAdminBookings = (state) => state.admin?.bookings || [];
export const selectAdminReviews = (state) => state.admin?.reviews || [];
export const selectMostBookedHotels = (state) => state.admin?.mostBookedHotels || [];
export const selectAdminLoading = (state) => state.admin?.loading;
export const selectAdminError = (state) => state.admin?.error;

export default adminSlice.reducer;
