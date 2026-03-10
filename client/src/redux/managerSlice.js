import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// Thunks for Manager Dashboard
export const fetchManagerStats = createAsyncThunk('manager/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('manager/stats');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchManagerHotels = createAsyncThunk('manager/fetchHotels', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('manager/hotels');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchManagerRooms = createAsyncThunk('manager/fetchRooms', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('manager/rooms');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchManagerBookings = createAsyncThunk('manager/fetchBookings', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('manager/bookings');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchManagerReviews = createAsyncThunk('manager/fetchReviews', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('manager/reviews');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createManagerRoom = createAsyncThunk(
  'manager/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await api.post('rooms', roomData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateManagerRoom = createAsyncThunk(
  'manager/updateRoom',
  async ({ roomId, roomData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`rooms/${roomId}`, roomData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteManagerHotel = createAsyncThunk('manager/deleteHotel', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`manager/hotels/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteManagerRoom = createAsyncThunk('manager/deleteRoom', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`manager/rooms/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateManagerBookingStatus = createAsyncThunk(
  'manager/updateBookingStatus',
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`manager/bookings/${bookingId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteManagerReview = createAsyncThunk('manager/deleteReview', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`manager/reviews/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const managerSlice = createSlice({
  name: 'manager',
  initialState: {
    stats: null,
    hotels: [],
    rooms: [],
    bookings: [],
    reviews: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(fetchManagerHotels.fulfilled, (state, action) => { state.hotels = action.payload; })
      .addCase(fetchManagerRooms.fulfilled, (state, action) => { state.rooms = action.payload; })
      .addCase(fetchManagerBookings.fulfilled, (state, action) => { state.bookings = action.payload; })
      .addCase(fetchManagerReviews.fulfilled, (state, action) => { state.reviews = action.payload; })
      .addCase(createManagerRoom.fulfilled, (state, action) => { state.rooms.push(action.payload); })
      .addCase(updateManagerRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(r => r._id === action.payload._id);
        if (index !== -1) state.rooms[index] = action.payload;
      })
      .addCase(deleteManagerRoom.fulfilled, (state, action) => { state.rooms = state.rooms.filter(r => r._id !== action.payload); })
      .addCase(deleteManagerHotel.fulfilled, (state, action) => { state.hotels = state.hotels.filter(h => h._id !== action.payload); })
      .addCase(updateManagerBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.bookings[index] = action.payload;
      })
      .addCase(deleteManagerReview.fulfilled, (state, action) => { state.reviews = state.reviews.filter(r => r._id !== action.payload); });
  }
});

export const selectManagerStats = (state) => state.manager.stats;
export const selectManagerHotels = (state) => state.manager.hotels;
export const selectManagerRooms = (state) => state.manager.rooms;
export const selectManagerBookings = (state) => state.manager.bookings;
export const selectManagerReviews = (state) => state.manager.reviews;
export const selectManagerLoading = (state) => state.manager.loading;
export const selectManagerError = (state) => state.manager.error;

export default managerSlice.reducer;