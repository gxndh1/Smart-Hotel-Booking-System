import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      // Backend uses PUT for cancellation to update status
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

// Admin: Update booking status (approve/reject)
export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking status');
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    allBookings: [],
    userBookings: [],
    loading: false,
    error: null
  },
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload;
        state.allBookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings.unshift(action.payload);
        state.allBookings.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const updatedBooking = action.payload;
        const updateList = (list) => {
          const index = list.findIndex(b => b._id === updatedBooking._id);
          if (index !== -1) {
            list[index] = updatedBooking;
          }
        };
        updateList(state.allBookings);
        updateList(state.userBookings);
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        // Update the booking in both arrays
        const updatedBooking = action.payload;
        const updateList = (list) => {
          const index = list.findIndex(b => b._id === updatedBooking._id);
          if (index !== -1) {
            list[index] = updatedBooking;
          }
        };
        updateList(state.allBookings);
        updateList(state.userBookings);
      });
  }
});

export const { clearBookingError } = bookingSlice.actions;

export const selectAllBookings = (state) => state.bookings?.allBookings || [];
export const selectUserBookings = (state) => state.bookings?.userBookings || [];
export const selectBookingById = (state, bookingId) =>
  (state.bookings?.allBookings || []).find(b => b._id === bookingId);
export default bookingSlice.reducer;
