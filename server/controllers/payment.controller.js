import mongoose from 'mongoose';
import Payment from '../models/payment.model.js';
import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import LoyaltyAccount from '../models/loyalty.model.js';
import Redemption from '../models/redemption.model.js';

// Loyalty points rate: 10% of booking amount
const LOYALTY_POINTS_RATE = 0.1;

// @desc    Create payment (simplified - no real gateway)
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'bookingId, amount, and paymentMethod are required' });
    }

    // Fetch booking with room details for amount calculation
    const booking = await Booking.findById(bookingId).populate('roomId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const redemptionDiscountAmount = booking.redemptionDiscountAmount || 0;

    // Get the redemption discount from booking
    const redemptionPointsUsed = booking.redemptionPointsUsed || 0;

    // Create payment record with actual amount after discount
    const payment = await Payment.create({
      userId: req.user.id,
      bookingId,
      amount,
      status: 'paid',
      paymentMethod,
      createdAt: new Date(),
    });

    // Update booking status to confirmed (standardized from 'success')
    booking.status = 'confirmed';
    booking.paymentId = payment._id;
    await booking.save();

    // Process redemption if points were used
    if (redemptionPointsUsed > 0) {
      let loyaltyAccount = await LoyaltyAccount.findOne({ userId: req.user.id });
      
      if (!loyaltyAccount || loyaltyAccount.redemptionPointsBalance < redemptionPointsUsed) {
        return res.status(400).json({ success: false, message: 'Insufficient redemption points balance at time of payment.' });
      }

      if (loyaltyAccount.redemptionPointsBalance >= redemptionPointsUsed) {
        loyaltyAccount.redemptionPointsBalance -= redemptionPointsUsed;
        loyaltyAccount.history.push({
          type: 'redeemed',
          points: redemptionPointsUsed,
          description: `Used ${redemptionPointsUsed} redemption points for booking discount`,
          date: new Date()
        });
        loyaltyAccount.lastUpdated = new Date();
        await loyaltyAccount.save();

        // Create redemption record
        const redemption = await Redemption.create({
          userId: req.user.id,
          bookingId: booking._id,
          pointsUsed: redemptionPointsUsed,
          discountAmount: redemptionDiscountAmount,
        });

        // Link redemption to booking
        booking.redemptionId = redemption._id;
        await booking.save();
      }
    }

    // FIX: Proper loyalty points calculation (10% of actual paid amount)
    let pointsEarned = 0;
    if (req.user.role === 'guest') {
      pointsEarned = Math.floor(amount * LOYALTY_POINTS_RATE);
      
      let loyalty = await LoyaltyAccount.findOne({ userId: req.user.id });
      if (!loyalty) {
        loyalty = await LoyaltyAccount.create({
          userId: req.user.id,
          pointsBalance: pointsEarned,
          redemptionPointsBalance: 0,
          history: [{
            type: 'earned',
            points: pointsEarned,
            description: `Loyalty points earned from hotel booking (10% of ₹${amount})`,
            date: new Date()
          }],
        });
      } else {
        loyalty.pointsBalance += pointsEarned;
        loyalty.history.push({
          type: 'earned',
          points: pointsEarned,
          description: `Loyalty points earned from hotel booking (10% of ₹${amount})`,
          date: new Date()
        });
        loyalty.lastUpdated = new Date();
        await loyalty.save();
      }
    }

    return res.status(201).json({
      success: true,
      data: payment,
      pointsEarned,
      redemptionUsed: redemptionPointsUsed,
      redemptionDiscount: redemptionDiscountAmount,
      message: `Payment successful! Booking confirmed. You earned ${pointsEarned} loyalty points${redemptionPointsUsed > 0 ? ` and used ${redemptionPointsUsed} redemption points for ₹${redemptionDiscountAmount} discount` : ''}`,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }
    const payments = await Payment.find(filter)
      .populate('bookingId', 'checkInDate checkOutDate status')
      .populate('userId', 'name email');

    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId')
      .populate('userId', 'name email contactNumber');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (req.user.role !== 'admin' && payment.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Refund payment
// @route   PUT /api/payments/:id
// @access  Private
export const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params._id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // FIX: Check if already refunded (idempotent)
    if (payment.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Payment already refunded' });
    }

    // Update payment status
    payment.status = 'refunded';
    await payment.save();

    // Update booking status and make room available again
    const booking = await Booking.findById(payment.bookingId).populate('roomId');
    if (booking) {
      booking.status = 'cancelled';
      await booking.save();

      // Make room available again
      const room = await Room.findById(booking.roomId);
      if (room) {
        room.availability = true;
        await room.save();
      }

      // FIX: Refund redemption points if any were used
      if (booking.redemptionPointsUsed > 0) {
        let loyaltyAccount = await LoyaltyAccount.findOne({ userId: booking.userId });
        if (loyaltyAccount) {
          loyaltyAccount.redemptionPointsBalance += booking.redemptionPointsUsed;
          loyaltyAccount.history.push({
            type: 'refunded',
            points: booking.redemptionPointsUsed,
            description: `Refunded ${booking.redemptionPointsUsed} redemption points for cancelled booking`,
            date: new Date()
          });
          loyaltyAccount.lastUpdated = new Date();
          await loyaltyAccount.save();
        }
      }
    }

    return res.status(200).json({ success: true, data: payment, message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('Refund payment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
