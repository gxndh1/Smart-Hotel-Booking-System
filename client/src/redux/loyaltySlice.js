import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// Fetch current user's loyalty account
export const fetchUserLoyalty = createAsyncThunk('loyalty/fetchUserLoyalty', async () => {
  try {
    const response = await api.get('/loyalty/me');
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { pointsBalance: 0, redemptionPointsBalance: 0, history: [] };
    }
    throw error;
  }
});

// Add loyalty points (internal use)
export const addLoyaltyPoints = createAsyncThunk('loyalty/addLoyaltyPoints', async (pointsData) => {
  const response = await api.post('/loyalty/add-points', pointsData);
  return response.data.data;
});

// Purchase redemption points with loyalty points (1:1 ratio)
export const purchaseRedemptionPoints = createAsyncThunk('loyalty/purchaseRedemptionPoints', async (points) => {
  const response = await api.post('/loyalty/purchase-redemption', { points });
  return response.data.data;
});

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState: {
    userLoyalty: null,
    loading: false,
    error: null,
    redemptionLoading: false,
    redemptionError: null,
    redemptionSuccess: false
  },
  reducers: {
    clearLoyaltyError: (state) => {
      state.error = null;
    },
    clearRedemptionStatus: (state) => {
      state.redemptionError = null;
      state.redemptionSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user loyalty
      .addCase(fetchUserLoyalty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLoyalty.fulfilled, (state, action) => {
        state.loading = false;
        state.userLoyalty = action.payload;
      })
      .addCase(fetchUserLoyalty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add loyalty points
      .addCase(addLoyaltyPoints.fulfilled, (state, action) => {
        state.userLoyalty = action.payload;
      })
      // Purchase redemption points
      .addCase(purchaseRedemptionPoints.pending, (state) => {
        state.redemptionLoading = true;
        state.redemptionError = null;
        state.redemptionSuccess = false;
      })
      .addCase(purchaseRedemptionPoints.fulfilled, (state, action) => {
        state.redemptionLoading = false;
        state.userLoyalty = action.payload;
        state.redemptionSuccess = true;
      })
      .addCase(purchaseRedemptionPoints.rejected, (state, action) => {
        state.redemptionLoading = false;
        state.redemptionError = action.payload || 'Failed to purchase redemption points';
      });
  }
});

export const { clearLoyaltyError, clearRedemptionStatus } = loyaltySlice.actions;
export default loyaltySlice.reducer;

// Selectors
export const selectUserLoyalty = (state) => state.loyalty?.userLoyalty || null;
export const selectLoyaltyLoading = (state) => state.loyalty?.loading || false;
export const selectLoyaltyError = (state) => state.loyalty?.error || null;
export const selectRedemptionLoading = (state) => state.loyalty?.redemptionLoading || false;
export const selectRedemptionError = (state) => state.loyalty?.redemptionError || null;
export const selectRedemptionSuccess = (state) => state.loyalty?.redemptionSuccess || false;

// Convenience selectors
export const selectLoyaltyPoints = (state) => state.loyalty?.userLoyalty?.pointsBalance || 0;
export const selectRedemptionPoints = (state) => state.loyalty?.userLoyalty?.redemptionPointsBalance || 0;
export const selectLoyaltyHistory = (state) => state.loyalty?.userLoyalty?.history || [];
