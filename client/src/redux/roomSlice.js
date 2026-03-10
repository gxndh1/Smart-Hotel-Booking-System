import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchRoomsByHotel = createAsyncThunk('rooms/fetchRoomsByHotel', async (hotelId, { rejectWithValue }) => {
  try {
    const response = await api.get('/rooms', {
      params: hotelId ? { hotelId } : {}
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch rooms');
  }
});

export const createRoom = createAsyncThunk('rooms/createRoom', async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data.data;
});

const roomSlice = createSlice({
  name: 'rooms',
  initialState: {
    allRooms: [],
    loading: false,
    error: null
  },
  reducers: {
    updateRoomAvailability: (state, action) => {
      const { roomId, availability } = action.payload;
      const room = state.allRooms.find(r => r._id === roomId);
      if (room) {
        room.availability = availability;
      }
    },

    addRoom: (state, action) => {
      state.allRooms.push(action.payload);
    },

    deleteRoom: (state, action) => {
      state.allRooms = state.allRooms.filter(r => r._id !== action.payload);
    },

    updateRoom: (state, action) => {
      const index = state.allRooms.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.allRooms[index] = { ...state.allRooms[index], ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomsByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomsByHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms = action.payload;
      })
      .addCase(fetchRoomsByHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms.push(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { updateRoomAvailability, addRoom, deleteRoom, updateRoom } = roomSlice.actions;

// Base selectors
const selectAllRoomsBase = (state) => state.rooms?.allRooms || [];

// Memoized selectors to prevent unnecessary rerenders
export const selectAllRooms = selectAllRoomsBase;

// Memoized selector factory - returns same reference if data hasn't changed
export const selectRoomsByHotel = createSelector(
  [selectAllRoomsBase, (state, hotelId) => hotelId],
  (rooms, hotelId) =>
    rooms.filter(
      room => {
        // Handle both cases: hotelId can be a string or an object with _id
        const roomHotelId = room.hotelId?._id || room.hotelId;
        return String(roomHotelId).toLowerCase() === String(hotelId).toLowerCase();
      }
    )
);
export default roomSlice.reducer;