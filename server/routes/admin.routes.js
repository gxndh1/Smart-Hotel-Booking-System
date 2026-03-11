import express from 'express';
import { getAllUsers,deleteUser,updateUserRole,getAllHotels,getAllBookings,getMostBookedHotels,getDashboardStats,getAllReviews} from '../controllers/admin.controller.js';
import { deleteHotel } from '../controllers/hotel.controller.js';
import { updateBookingStatus } from '../controllers/booking.controller.js';
import { deleteReview } from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
const router = express.Router();


// ONLY ADMIN CAN ACCESS THE ROUTES
router.use(protect, authorize('admin'));
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/hotels', getAllHotels);
router.delete('/hotels/:id', deleteHotel);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.get('/analytics/most-booked', getMostBookedHotels);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

export default router;
