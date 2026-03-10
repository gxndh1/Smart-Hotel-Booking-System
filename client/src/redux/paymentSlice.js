import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments', paymentData);
      // Return the payment data merged with pointsEarned from the server response
      return { ...response.data.data, pointsEarned: response.data.pointsEarned };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment processing failed');
    }
  }
);

export const fetchUserPayments = createAsyncThunk('payment/fetchUserPayments', async () => {
  const response = await api.get('/payments');
  return response.data.data;
});

export const refundPayment = createAsyncThunk('payment/refundPayment', async (paymentId) => {
  const response = await api.put(`/payments/${paymentId}`);
  return response.data.data;
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    payments: [],
    currentPayment: null,
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
        state.payments.push(action.payload);
        state.success = true;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      });
  }
});

export const { clearSuccess } = paymentSlice.actions;
export default paymentSlice.reducer;
