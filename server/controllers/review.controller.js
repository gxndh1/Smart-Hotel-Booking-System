import Review from '../models/review.model.js';
import Hotel from '../models/hotel.model.js';
import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';

// @desc    Submit a review and update hotel rating
// @route   POST /api/reviews
// @access  Private (guest)
export const createReview = async (req, res) => {
  try {
    // Handle both camelCase and PascalCase from frontend
    const hotelId = req.body.hotelId || req.body.HotelID;
    const rating = req.body.rating !== undefined ? req.body.rating : req.body.Rating;
    const comment = req.body.comment || req.body.Comment;

    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, message: 'Only guests can submit reviews' });
    }

    if (!hotelId || rating === undefined) {
      return res.status(400).json({ success: false, message: 'hotelId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Check for duplicate review - prevent same user from reviewing same hotel multiple times
    const existingReview = await Review.findOne({
      userId: req.user.id,
      hotelId
    });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this hotel. Please update your existing review instead.' 
      });
    }

    // Check if user has a completed booking for this hotel to set isVerified
    const rooms = await Room.find({ hotelId }).select('_id');
    const roomIds = rooms.map(r => r._id);
    
    const completedBooking = await Booking.findOne({
      userId: req.user.id,
      roomId: { $in: roomIds },
      status: 'completed'
    });

    const review = await Review.create({
      userId: req.user.id,
      hotelId,
      rating,
      comment: comment || '',
      isVerified: !!completedBooking
    });

    // Populate user info before returning to ensure immediate reflection in UI
    await review.populate('userId', 'name email');

    return res.status(201).json({ 
      success: true, 
      data: review,
      message: 'Review submitted successfully!' 
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get reviews for a hotel or all reviews
// @route   GET /api/reviews?HotelID=id
// @access  Public
export const getReviews = async (req, res) => {
  try {
    const { hotelId } = req.query;
    let filter = {};
    if (hotelId) {
      filter.hotelId = hotelId;
    }
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('hotelId', 'name location');
      
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Get review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update review and recalculate hotel rating
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (rating !== undefined) review.rating = rating;
    if (comment) review.comment = comment;

    // Re-verify booking status to potentially upgrade to isVerified badge
    if (!review.isVerified) {
      const rooms = await Room.find({ hotelId: review.hotelId }).select('_id');
      const roomIds = rooms.map(r => r._id);
      
      const completedBooking = await Booking.findOne({
        userId: req.user.id,
        roomId: { $in: roomIds },
        status: 'completed'
      });

      if (completedBooking) review.isVerified = true;
    }
    
    await review.save();

    // Populate user info before returning
    await review.populate('userId', 'name email');

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete review and recalculate hotel rating
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isAuthor = review.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const hotel = await Hotel.findById(review.hotelId);
    const isHotelManager = hotel && hotel.managerId.toString() === req.user.id;

    if (!isAuthor && !isAdmin && !isHotelManager) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Manager respond to review
// @route   PUT /api/reviews/:id/respond
// @access  Private (manager)
export const respondToReview = async (req, res) => {
  try {
    const { managerReply } = req.body;

    if (!managerReply) {
      return res.status(400).json({ success: false, message: 'Manager reply is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user is a manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers can respond to reviews' });
    }

    // If manager (not admin), verify they own the hotel this review is for
    if (req.user.role === 'manager') {
      const hotel = await Hotel.findById(review.hotelId);
      if (!hotel || hotel.managerId?.toString() !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not authorized to respond to reviews for this hotel' 
        });
      }
    }

    // Add manager reply
    review.managerReply = managerReply;
    review.managerReplyDate = new Date();
    review.managerId = req.user.id;
    await review.save();

    const reviewResponse = review.toObject();
    // Add repliedAt alias for frontend consistency
    reviewResponse.repliedAt = review.managerReplyDate;
    // Standardize date field
    reviewResponse.createdAt = review.createdAt;

    return res.status(200).json({ 
      success: true, 
      data: reviewResponse,
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get reviews for manager's hotel
// @route   GET /api/reviews/manager/:hotelId
// @access  Private (manager)
export const getManagerHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Verify the manager owns this hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Check if the requesting manager owns this hotel
    if (req.user.role === 'manager' && hotel.managerId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view reviews for this hotel' });
    }

    const reviews = await Review.find({ hotelId: hotelId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get manager hotel reviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
