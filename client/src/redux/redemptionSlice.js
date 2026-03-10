import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchRedemptions = createAsyncThunk('redemptions/fetchRedemptions', async () => {
  const response = await api.get('/redemptions');
  return response.data.data;
});

export const createRedemption = createAsyncThunk('redemptions/createRedemption', async (redemptionData) => {
  const response = await api.post('/redemptions', redemptionData);
  return response.data.data;
});

const redemptionSlice = createSlice({
  name: 'redemptions',
  initialState: {
    redemptions: [],
    loading: false,
    error: null
  },
  reducers: {
    clearRedemptionError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRedemptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRedemptions.fulfilled, (state, action) => {
        state.loading = false;
        state.redemptions = action.payload;
      })
      .addCase(fetchRedemptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createRedemption.fulfilled, (state, action) => {
        state.redemptions.push(action.payload);
      });
  }
});

export const { clearRedemptionError } = redemptionSlice.actions;
export default redemptionSlice.reducer;
