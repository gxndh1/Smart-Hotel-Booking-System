import express from 'express';
import {
  getManagerDashboardStats,
  getManagerHotels,
  getManagerRooms,
  getManagerBookings,
  updateManagerBookingStatus,
  getManagerReviews,
  deleteManagerReview,
  getManagerProfile
} from '../controllers/manager.controller.js';
import { createHotel, updateHotel, deleteHotel } from '../controllers/hotel.controller.js';
import { createRoom, updateRoom, deleteRoom } from '../controllers/room.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and manager role
router.use(protect, authorize('manager'));

// Dashboard
router.get('/stats', getManagerDashboardStats);

// Profile
router.get('/profile', getManagerProfile);

// Hotels management
router.get('/hotels', getManagerHotels);
router.post('/hotels', createHotel);
router.put('/hotels/:id', updateHotel);
router.delete('/hotels/:id', deleteHotel);

// Rooms management
router.get('/rooms', getManagerRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Bookings management
router.get('/bookings', getManagerBookings);
router.put('/bookings/:id/status', updateManagerBookingStatus);

// Reviews management
router.get('/reviews', getManagerReviews);
router.delete('/reviews/:id', deleteManagerReview);

export default router;
