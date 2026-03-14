import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import Hotel from '../models/hotel.model.js';
import LoyaltyAccount from '../models/loyalty.model.js';
import User from '../models/user.model.js';

// @desc    Create booking with loyalty points calculation
// @route   POST /api/bookings
// @access  Private (guest)
export const createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, numberOfRooms, redemptionPointsUsed, extras, extrasAmount, additionalGuests } = req.body;
    const numRooms = numberOfRooms || 1;

    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, message: 'Only guests can book rooms' });
    }

    if (!roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ success: false, message: 'roomId, checkInDate and checkOutDate are required' });
    }

    // FIX: Add date validation
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
    }

    // FIX: Compare dates at midnight to allow same-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past' });
    }

    // Validate redemption points if provided
    if (redemptionPointsUsed && redemptionPointsUsed > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 redemption points can be used at once' });
    }

    // Validate user has enough redemption points
    const loyaltyAccount = await LoyaltyAccount.findOne({ userId: req.user.id });
    if (redemptionPointsUsed > 0 && (!loyaltyAccount || loyaltyAccount.redemptionPointsBalance < redemptionPointsUsed)) {
      return res.status(400).json({ success: false, message: `Insufficient redemption points. Available: ${loyaltyAccount?.redemptionPointsBalance || 0}` });
    }

    // Check if room exists and is available
    const room = await Room.findById(roomId).populate({
      path: 'hotelId',
      populate: { path: 'managerId', select: 'email' }
    });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Fetch guest email and name
    const guest = await User.findById(req.user.id).select('email name');
    const guestEmail = guest ? guest.email : '';
    const guestName = guest ? guest.name : '';
    const managerEmail = room.hotelId?.managerId?.email || '';

    // Check inventory availability
    // Only count confirmed bookings or recent pending ones from OTHER users to prevent self-lockouts
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await Booking.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          $or: [
            { status: { $in: ['confirmed', 'completed'] } },
            {
              status: 'pending',
              userId: { $ne: req.user._id },
              createdAt: { $gte: fifteenMinsAgo }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalBooked: { $sum: '$numberOfRooms' }
        }
      }
    ]);

    const activeBookedRooms = result.length > 0 ? result[0].totalBooked : 0;

    // Robust check for availability and total rooms (handles PascalCase/camelCase inconsistencies)
    const isRoomAvailable = room.availability ?? room.Availability ?? true;
    const maxRooms = room.totalRooms ?? room.TotalRooms ?? 1;

    if (!isRoomAvailable || (activeBookedRooms + numRooms > maxRooms)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, the selected room type is no longer available for your request.'
      });
    }

    // FIX: Redemption rate standardized to 1 point = 1 rupee
    const redemptionDiscountAmount = redemptionPointsUsed ? redemptionPointsUsed * 1 : 0;

    // Calculate total price based on logic in getBookings
    const totalNights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const roomPrice = room.price || 0;
    const basePrice = roomPrice * totalNights * numRooms;
    const tax = basePrice * 0.12;
    const finalExtrasAmount = extrasAmount || 0;
    const totalPrice = basePrice + tax + finalExtrasAmount - redemptionDiscountAmount;

    // Create booking with pending status
    const booking = await Booking.create({
      userId: req.user.id,
      roomId,
      numberOfRooms: numRooms,
      checkInDate,
      checkOutDate,
      status: 'pending',
      guestEmail,
      guestName,
      managerEmail,
      hotelName: room.hotelId?.name || '',
      roomType: room.type || '',
      totalPrice,
      redemptionPointsUsed: redemptionPointsUsed || 0,
      redemptionDiscountAmount: redemptionDiscountAmount,
      extras: extras || [],
      extrasAmount: finalExtrasAmount,
      additionalGuests: additionalGuests || []
    });

    // Note: Loyalty points and room availability are handled in the payment controller
    // when payment is confirmed to avoid double counting and ensure proper flow

    // Populate the booking with room details for response
    await booking.populate('roomId');

    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking initialized successfully.'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'manager') {
      // Find hotels managed by this user
      const hotels = await Hotel.find({ managerId: req.user.id });

      const hotelIds = hotels.map(h => h._id);

      // Find rooms for these hotels
      const rooms = await Room.find({ hotelId: { $in: hotelIds } });
      const roomIds = rooms.map(r => r._id);

      filter.roomId = { $in: roomIds };
    } else if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'roomId',
        select: 'type price hotelId',
        populate: {
          path: 'hotelId',
          select: 'name location'
        }
      })
      .populate('userId', 'name email');

    const enrichedBookings = bookings.map(booking => {
      // Calculate total nights
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const totalNights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

      // Calculate price
      const roomPrice = booking.roomId?.price || 0;
      const basePrice = roomPrice * totalNights * booking.numberOfRooms;
      const tax = basePrice * 0.12;
      const extrasAmount = booking.extrasAmount || 0;
      const totalPrice = basePrice + tax + extrasAmount - (booking.redemptionDiscountAmount || 0);

      return {
        ...booking.toObject(),
        totalPrice
      };
    });

    return res.status(200).json({ success: true, data: enrichedBookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomId')
      .populate('userId', 'name email contactNumber');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, checkInDate, checkOutDate } = req.body;
    if (status) booking.status = status;
    if (checkInDate) booking.checkInDate = checkInDate;
    if (checkOutDate) booking.checkOutDate = checkOutDate;

    await booking.save();
    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (user can cancel their own booking)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId' }
      })
      .populate('paymentId')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user data missing' });
    }

    // Authorization logic: Owner (Guest), Admin, or Hotel Manager
    let isAuthorized = false;

    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (booking.userId && booking.userId._id.toString() === req.user.id) {
      isAuthorized = true;
    } else if (req.user.role === 'manager') {
      const hotelManagerId = booking.roomId?.hotelId?.managerId?.toString();
      if (hotelManagerId === req.user.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled (must be before 1 day of check-in)
    const checkInDate = new Date(booking.checkInDate);
    const currentDate = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeUntilCheckIn = checkInDate.getTime() - currentDate.getTime();

    if (timeUntilCheckIn < oneDayInMs) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking. Cancellations must be made at least 1 day before check-in date.'
      });
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // If booking was confirmed, handle loyalty points deduction and redemption refund
    if (booking.status === 'confirmed') {
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId: booking.userId._id });

      if (loyaltyAccount) {
        // 1. Deduct points earned (10% of payment amount)
        if (booking.paymentId && booking.paymentId.amount > 0) {
          const pointsEarned = Math.floor(booking.paymentId.amount * 0.1);
          if (pointsEarned > 0) {
            loyaltyAccount.pointsBalance = Math.max(0, loyaltyAccount.pointsBalance - pointsEarned);
            loyaltyAccount.history.push({
              type: 'cancelled',
              points: pointsEarned,
              description: `Deducted ${pointsEarned} points for cancelled booking ${booking._id}`,
              date: new Date()
            });
          }
        }

        // 2. Refund redemption points used
        if (booking.redemptionPointsUsed > 0) {
          loyaltyAccount.redemptionPointsBalance += booking.redemptionPointsUsed;
          loyaltyAccount.history.push({
            type: 'refunded',
            points: booking.redemptionPointsUsed,
            description: `Refunded ${booking.redemptionPointsUsed} redemption points for cancelled booking`,
            date: new Date()
          });
        }

        loyaltyAccount.lastUpdated = new Date();
        await loyaltyAccount.save();
      }
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Make room available again if it was marked unavailable
    const room = await Room.findById(booking.roomId?._id);
    if (room && !room.availability) {
      room.availability = true;
      await room.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update booking status (for managers to approve/disapprove)
// @route   PUT /api/bookings/:id/status
// @access  Private (manager, admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    console.log('[Booking Status Update] Request received, booking ID:', id, 'Status:', status, 'User:', req.user);

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed'
      });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId' }
      })
      .populate('paymentId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('[Booking Status Update] Booking found, Room:', booking.roomId);

    // Check if user is a manager for this hotel
    if (req.user.role === 'manager') {
      const hotelId = booking.roomId?.hotelId?._id || booking.roomId?.hotelId;

      if (!hotelId) {
        console.log('[Booking Status Update] No hotel found for this booking');
        return res.status(400).json({
          success: false,
          message: 'Unable to find hotel for this booking'
        });
      }

      const hotel = await Hotel.findById(hotelId);

      console.log('[Booking Status Update] Hotel managerId:', hotel?.managerId, 'User ID:', req.user.id);

      if (!hotel || hotel.managerId?.toString() !== req.user.id) {
        console.log('[Booking Status Update] Manager authorization failed');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update bookings for this hotel'
        });
      }
    }

    const oldStatus = booking.status;
    const newStatus = status.toLowerCase();

    // Handle Loyalty Points Update
    if (newStatus === 'completed' && oldStatus !== 'completed' && oldStatus !== 'confirmed') {
      // Award points if moving to completed from a state where points weren't awarded (e.g. pending)
      if (booking.userId && (booking.userId.role === 'guest' || booking.userId.Role === 'guest')) {
        let loyaltyAccount = await LoyaltyAccount.findOne({ userId: booking.userId._id });

        // Calculate amount: use payment amount if exists, otherwise calculate from booking details
        let amount = booking.paymentId?.amount;
        if (!amount) {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;
          amount = (booking.roomId?.price || 0) * nights * booking.numberOfRooms;
        }

        const pointsEarned = Math.floor(amount * 0.1);
        if (pointsEarned > 0) {
          if (!loyaltyAccount) {
            loyaltyAccount = await LoyaltyAccount.create({
              userId: booking.userId._id,
              pointsBalance: pointsEarned,
              history: [{
                type: 'earned',
                points: pointsEarned,
                description: `Points earned for completed stay ${booking._id}`,
                date: new Date()
              }]
            });
          } else {
            loyaltyAccount.pointsBalance += pointsEarned;
            loyaltyAccount.history.push({
              type: 'earned',
              points: pointsEarned,
              description: `Points earned for completed stay ${booking._id}`,
              date: new Date()
            });
            loyaltyAccount.lastUpdated = new Date();
            await loyaltyAccount.save();
          }
        }
      }
    } else if (newStatus === 'cancelled' && oldStatus === 'confirmed' &&
      (booking.userId?.role === 'guest' || booking.userId?.Role === 'guest')) {
      // Deduct points if a confirmed booking is cancelled by a manager
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId: booking.userId._id });
      if (loyaltyAccount) {
        // 1. Deduct points earned
        const amount = booking.paymentId?.amount || 0;
        const pointsEarned = Math.floor(amount * 0.1);
        if (pointsEarned > 0) {
          loyaltyAccount.pointsBalance = Math.max(0, loyaltyAccount.pointsBalance - pointsEarned);
          loyaltyAccount.history.push({
            type: 'cancelled',
            points: pointsEarned,
            description: `Deducted points for manager-cancelled booking ${booking._id}`,
            date: new Date()
          });
        }
        // 2. Refund redemption points
        if (booking.redemptionPointsUsed > 0) {
          loyaltyAccount.redemptionPointsBalance += booking.redemptionPointsUsed;
          loyaltyAccount.history.push({
            type: 'refunded',
            points: booking.redemptionPointsUsed,
            description: `Refunded redemption points for manager-cancelled booking`,
            date: new Date()
          });
        }
        loyaltyAccount.lastUpdated = new Date();
        await loyaltyAccount.save();
      }
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // Sync room availability if status changed to cancelled
    if (status.toLowerCase() === 'cancelled') {
      const room = await Room.findById(booking.roomId?._id);
      if (room && !room.availability) {
        room.availability = true;
        await room.save();
      }
    }

    console.log('[Booking Status Update] Booking status updated successfully');
    return res.status(200).json({
      success: true,
      data: booking,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single booking with full details
// @route   GET /api/bookings/:id/details
// @access  Private
export const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'roomId',
        populate: {
          path: 'hotelId',
          select: 'name location address image rating description'
        }
      })
      .populate('userId', 'name email contactNumber')
      .populate('paymentId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is authorized (owner or admin)
    if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    // Calculate total nights and price
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const roomPrice = booking.roomId?.price || 0;
    const basePrice = roomPrice * totalNights * booking.numberOfRooms;
    const tax = basePrice * 0.12;
    const extrasAmount = booking.extrasAmount || 0;
    const totalPrice = basePrice + tax + extrasAmount - (booking.redemptionDiscountAmount || 0);

    // Check if cancellation is allowed
    const currentDate = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeUntilCheckIn = checkIn.getTime() - currentDate.getTime();
    const canCancel = timeUntilCheckIn >= oneDayInMs && booking.status !== 'cancelled';

    const responseData = {
      _id: booking._id,
      bookingId: booking._id,
      status: booking.status,
      numberOfRooms: booking.numberOfRooms,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalNights,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      canCancel,
      user: {
        name: booking.userId?.name,
        email: booking.userId?.email,
        phone: booking.userId?.contactNumber
      },
      room: {
        type: booking.roomId?.type,
        price: roomPrice,
        features: booking.roomId?.features,
        image: booking.roomId?.image
      },
      hotel: {
        name: booking.roomId?.hotelId?.name,
        location: booking.roomId?.hotelId?.location,
        address: booking.roomId?.hotelId?.address,
        image: booking.roomId?.hotelId?.image,
        rating: booking.roomId?.hotelId?.rating,
        description: booking.roomId?.hotelId?.description
      },
      payment: booking.paymentId ? {
        method: booking.paymentId.paymentMethod,
        amount: booking.paymentId.amount,
        status: booking.paymentId.status,
        date: booking.paymentId.createdAt
      } : null,
      extras: booking.extras || [],
      extrasAmount: booking.extrasAmount || 0,
      additionalGuests: booking.additionalGuests || [],
      totalPrice
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
