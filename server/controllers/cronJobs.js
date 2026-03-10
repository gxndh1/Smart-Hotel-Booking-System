import cron from 'node-cron';
import Booking from '../models/booking.model.js';

/**
 * Initializes scheduled tasks for the application
 */
export const initCronJobs = () => {
  // Run every hour at the start of the hour (00:00, 01:00, etc.)
  // Pattern: minute hour day-of-month month day-of-week
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled check for completed bookings...');
    
    try {
      const now = new Date();

      // Find bookings that are 'confirmed' but the check-out date has passed
      const bookingsToComplete = await Booking.find({
        status: 'confirmed',
        checkOutDate: { $lt: now }
      });

      if (bookingsToComplete.length > 0) {
        for (const booking of bookingsToComplete) {
          booking.status = 'completed';
          // Saving triggers the updateRoomAvailability middleware in booking.model.js
          await booking.save();
        }
        console.log(`[Cron] Successfully transitioned ${bookingsToComplete.length} bookings to 'completed'.`);
      }
    } catch (error) {
      console.error('[Cron] Error during booking status auto-update:', error);
    }
  });
};