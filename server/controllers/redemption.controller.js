import Redemption from '../models/redemption.model.js';
import LoyaltyAccount from '../models/loyalty.model.js';
import Booking from '../models/booking.model.js';


export const createRedemption = async (req, res) => {
  try {
    const { bookingId, pointsUsed } = req.body;

    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, message: 'Only guests can redeem points' });
    }

    if (!bookingId || !pointsUsed) {
      return res.status(400).json({ success: false, message: 'bookingId and pointsUsed are required' });
    }

    // Validate max redemption points (max 500 at once)
    if (pointsUsed > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 redemption points can be used at once' });
    }

    // Check loyalty account
    const account = await LoyaltyAccount.findOne({ userId: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Loyalty account not found' });
    }
    
    // Use RedemptionPointsBalance (not regular PointsBalance)
    if (account.redemptionPointsBalance < pointsUsed) {
      return res.status(400).json({ success: false, message: 'Insufficient redemption points. You have ' + account.redemptionPointsBalance + ' redemption points' });
    }

    // FIX: Redemption rate standardized to 1 point = 1 rupee discount
    const discountAmount = pointsUsed * 1;

    // Deduct redemption points and add to history
    account.redemptionPointsBalance -= pointsUsed;
    account.history.push({
      type: 'redeemed',
      points: pointsUsed,
      description: `Used ${pointsUsed} redemption points for booking discount`,
      date: new Date()
    });
    account.lastUpdated = new Date();
    await account.save();

    // Create redemption record
    const redemption = await Redemption.create({
      userId: req.user.id,
      bookingId,
      pointsUsed,
      discountAmount,
    });

    return res.status(201).json({ 
      success: true, 
      data: redemption,
      message: `Redemption successful! You got ${discountAmount} rupees discount` 
    });
  } catch (error) {
    console.error('Create redemption error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get user's redemptions
// @route   GET /api/redemptions
// @access  Private
export const getRedemptions = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }
    const redemptions = await Redemption.find(filter)
      .populate('bookingId', 'checkInDate checkOutDate status')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: redemptions });
  } catch (error) {
    console.error('Get redemptions error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single redemption
// @route   GET /api/redemptions/:id
// @access  Private
export const getRedemption = async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id)
      .populate('bookingId')
      .populate('userId', 'name email contactNumber');

    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption not found' });
    }
    if (req.user.role !== 'admin' && redemption.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, data: redemption });
  } catch (error) {
    console.error('Get redemption error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete redemption (admin only)
// @route   DELETE /api/redemptions/:id
// @access  Private (admin)
export const deleteRedemption = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption not found' });
    }

    await Redemption.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Redemption deleted' });
  } catch (error) {
    console.error('Delete redemption error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};