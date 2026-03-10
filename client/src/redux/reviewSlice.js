import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchReviews = createAsyncThunk('reviews/fetchReviews', async () => {
  const response = await api.get('/reviews');
  return response.data.data;
});

export const createReview = createAsyncThunk('reviews/createReview', async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data.data;
});

export const deleteReview = createAsyncThunk('reviews/deleteReview', async (reviewId) => {
  await api.delete(`/reviews/${reviewId}`);
  return reviewId;
});

// New thunk for manager reply to review
export const respondToReview = createAsyncThunk('reviews/respondToReview', async ({ reviewId, managerReply }) => {
  const response = await api.put(`/reviews/${reviewId}/respond`, { managerReply });
  return response.data.data;
});

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    loading: false,
    error: null
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.push(action.payload);
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r.id !== action.payload && r._id !== action.payload);
      })
      // Handle manager reply response
      .addCase(respondToReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToReview.fulfilled, (state, action) => {
        state.loading = false;
        // Update the review with the new reply
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })
      .addCase(respondToReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearReviewError } = reviewSlice.actions;

// Selector to get reviews for a specific hotel
export const selectHotelReviews = (hotelId) => (state) => 
  (state.reviews?.reviews || []).filter(
    review => String(review.hotelId?._id || review.hotelId) === String(hotelId)
  );

// Base selector
export const selectAllReviews = (state) => state.reviews?.reviews || [];
export default reviewSlice.reducer;
