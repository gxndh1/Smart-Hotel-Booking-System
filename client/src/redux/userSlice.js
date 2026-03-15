import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';


export const fetchAllUsers = createAsyncThunk('users/fetchAllUsers', async () => {
  const response = await api.get('/auth/users');
  return response.data.data;
});


export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
});

const userSlice = createSlice({
  name: 'users',
  initialState: {
    allUsers: [],
    recentVisits: [],
    loading: false,
    error: null
  },
  reducers: {
    addToRecentVisits: (state, action) => {
      if (!Array.isArray(state.recentVisits)) state.recentVisits = [];
      const exists = state.recentVisits.find(u => u._id === action.payload._id);
      if (!exists) {
        state.recentVisits.unshift(action.payload);
        if (state.recentVisits.length > 5) state.recentVisits.pop();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers (legacy)
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchAllUsers (admin)
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { addToRecentVisits } = userSlice.actions;

// Selectors
export const selectAllUsers = (state) => state.users.allUsers;
export const selectRecentVisits = (state) => state.users.recentVisits;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;

export default userSlice.reducer;
