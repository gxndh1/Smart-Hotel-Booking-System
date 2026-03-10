import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../utils/api";

// Async thunk to verify user with server
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('auth/me');
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 401) return null;
      return rejectWithValue(error.message || 'Network error during authentication');
    }
  },
  {
    condition: (_, { getState }) => {
      const { loading } = getState().auth;
      if (loading) return false;
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('auth/login', credentials);
      return response.data; // Returns { success, message, token, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for registration
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for logout - properly handles the logout process
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('auth/logout');
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the server call fails, we should clear the client state
      return true; 
    }
  }
);

// Async thunk to fetch full account data (User + Bookings)
export const fetchAccountData = createAsyncThunk(
  'auth/fetchAccountData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('auth/account-data');
      return response.data.data; // Returns { user, bookings }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to update user profile information
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('auth/update-profile', profileData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// FIXED: No localStorage/sessionStorage - all data comes from backend
// Initial state has no stored user - must check with backend
const initialState = {
  user: null,
  token: null, // Token is stored in HTTP-only cookie only
  isAuthenticated: false,
  loading: false, 
  isInitialized: false, // Flag to track if the first check is done
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // FIXED: Login action - stores user from server response (no persistence)
    login: (state, action) => {
      const { user } = action.payload;
      state.isAuthenticated = true;
      state.user = user;
      state.token = null;
      state.error = null;
      state.loading = false;
      // NO localStorage/sessionStorage - rely on cookies and backend
    },

    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Update user from server response
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Action to trigger a global state reset in the root reducer
    resetAll: () => {
      // Logic is handled in store.js rootReducer
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Auth - loads user from backend
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.isInitialized = true;
          state.error = null;
          // NO localStorage/sessionStorage - data comes from backend
        } else {
          // User is not authenticated (null returned)
          state.user = null;
          state.isAuthenticated = false;
          state.isInitialized = true;
          state.error = null;
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.error = action.payload || 'Authentication failed';
      })
      
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loading = false;
        // NO localStorage/sessionStorage to clear
      })
      .addCase(logout.rejected, (state) => {
        // Even on failure, clear the client state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      // Fetch Account Data
      .addCase(fetchAccountData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccountData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(fetchAccountData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If fetching account data fails, the session is likely invalid
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { login, clearError, updateUser, setLoading, resetAll } = authSlice.actions;
export default authSlice.reducer;
