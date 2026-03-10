import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../utils/api';

export const MIN_PRICE = 200;
export const MAX_PRICE = 20000;

// Async thunk to fetch hotels from backend with filters
export const fetchHotels = createAsyncThunk('hotels/fetchHotels', async (filters = {}, { rejectWithValue }) => {
  const params = new URLSearchParams();
  
  if (filters.location && filters.location !== 'Any region') {
    params.append('location', filters.location);
  }
  if (filters.priceMin && filters.priceMin > MIN_PRICE) {
    params.append('priceMin', filters.priceMin);
  }
  if (filters.priceMax && filters.priceMax < MAX_PRICE) {
    params.append('priceMax', filters.priceMax);
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  if (filters.guests) {
    params.append('guests', filters.guests);
  }
  if (filters.page) {
    params.append('page', filters.page);
  }
  if (filters.limit) {
    params.append('limit', filters.limit);
  }
  if (filters.onlyAvailable) {
    params.append('onlyAvailable', 'true');
  }
  if (filters.searchQuery) {
    params.append('searchQuery', filters.searchQuery);
  }
  if (filters.advancedFeatures && filters.advancedFeatures.length > 0) {
    params.append('features', filters.advancedFeatures.join(','));
  }

  try {
    const response = await api.get(`/hotels?${params.toString()}`);
    return response.data; // Return full response to get total count
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch hotels');
  }
},
{
  condition: (_, { getState }) => {
    const { loading } = getState().hotels;
    if (loading) return false;
  }
});

// Async thunk to create a new hotel
export const createHotel = createAsyncThunk('hotels/createHotel', async (hotelData, { rejectWithValue }) => {
  try {
    const response = await api.post('/hotels', hotelData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create hotel');
  }
});

// Async thunk to update an existing hotel
export const updateHotel = createAsyncThunk('hotels/updateHotel', async ({ id, hotelData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/hotels/${id}`, hotelData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update hotel');
  }
});

// Async thunk to fetch a single hotel by ID
export const fetchHotelById = createAsyncThunk('hotels/fetchHotelById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/hotels/${id}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch hotel details');
  }
});

const initialFilters = {
  location: "Any region",
  priceMin: MIN_PRICE,
  priceMax: MAX_PRICE,
  sortBy: "Rating & Recommended", // Aligned with backend controller cases
  advancedFeatures: [],
  searchQuery: "",
  onlyAvailable: false,
  startDate: null,
  endDate: null,
  guests: 1,
  page: 1,
  limit: 12
};

const hotelSlice = createSlice({
  name: 'hotels',
  initialState: {
    allHotels: [],
    totalHotels: 0,
    selectedHotel: null,
    filters: initialFilters,
    loading: false,
    error: null
  },
  reducers: {
    setGlobalFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },
    clearSelectedHotel: (state) => {
      state.selectedHotel = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.allHotels = action.payload.data || [];
        state.totalHotels = action.payload.total;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Fetch Single Hotel
      .addCase(fetchHotelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHotel = action.payload;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Create Hotel
      .addCase(createHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.allHotels.push(action.payload);
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Hotel
      .addCase(updateHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.allHotels.findIndex(h => h._id === action.payload._id);
        if (index !== -1) {
          state.allHotels[index] = action.payload;
        }
        if (state.selectedHotel?._id === action.payload._id) {
          state.selectedHotel = action.payload;
        }
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setGlobalFilters, resetFilters, clearSelectedHotel } = hotelSlice.actions;

export const selectAllHotels = (state) => state.hotels.allHotels;
export const selectFilters = (state) => state.hotels.filters;

export const selectFilteredHotels = selectAllHotels;

// NEW: Selector to count active filters for UI badges
export const selectActiveFilterCount = createSelector(
  [selectFilters],
  (filters) => {
    let count = 0;
    if (filters.location !== "Any region") count++;
    if (filters.priceMin > MIN_PRICE || filters.priceMax < MAX_PRICE) count++;
    if (filters.advancedFeatures.length > 0) count++;
    if (filters.onlyAvailable) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.guests > 1) count++;
    return count;
  }
);

export default hotelSlice.reducer;
