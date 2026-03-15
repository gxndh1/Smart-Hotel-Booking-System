import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import hotelReducer from './hotelSlice';
import userReducer from './userSlice';
import roomReducer from './roomSlice';
import bookingReducer from './bookingSlice';
import paymentReducer from './paymentSlice';
import reviewReducer from './reviewSlice';
import redemptionReducer from './redemptionSlice';
import loyaltyReducer from './loyaltySlice';
import managerReducer from './managerSlice';
import adminReducer from './adminSlice';


//REDUX STATE TREE
const appReducer = combineReducers({
  auth: authReducer,
  hotels: hotelReducer,
  users: userReducer,
  rooms: roomReducer,
  bookings: bookingReducer,
  payment: paymentReducer,
  reviews: reviewReducer,
  redemptions: redemptionReducer,
  loyalty: loyaltyReducer,
  manager: managerReducer,
  admin: adminReducer,
});

const rootReducer = (state, action) => {
  // Reset the entire state when logout is successful, fails, or resetAll is dispatched
  if (action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected' || action.type === 'auth/resetAll') {
    // Clear persisted storage to prevent data rehydration on next load
    storage.removeItem('persist:smart-hotel-v2');
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'smart-hotel-v2',
  storage,
  whitelist: ['auth', 'users', 'bookings', 'payment', 'redemptions', 'hotels', 'rooms', 'reviews', 'loyalty', 'manager']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionPaths: ['payload'],
        ignoredPaths: [
          'bookings.allBookings',
          'payment.payments',
          'redemptions.allRedemptions'
        ]
      }
    })
});

export const persistor = persistStore(store);
