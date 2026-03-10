
import Hotel from '../models/hotel.model.js';
import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import Redemption from '../models/redemption.model.js';
import Review from '../models/review.model.js';
import User from '../models/user.model.js';

// @desc    Create a new hotel (manager or admin)
// @route   POST /api/hotels
// @access  Private (manager/admin)
export const createHotel = async (req, res) => {
  try {
    const { name, location, description, amenities, image } = req.body;

    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers can create hotels' });
    }

    if (!name || !location) {
      return res.status(400).json({ success: false, message: 'Name and Location are required' });
    }

    // Fetch user to get email
    const manager = await User.findById(req.user.id).select('email');

    // Create hotel with ManagerID = current user's ID
    // Hotel now directly references User._id
    const hotel = await Hotel.create({
      name,
      location,
      description: description || '',
      amenities: amenities || [],
      image: image || '',
      managerId: req.user.id,
      managerEmail: manager ? manager.email : '',
      rating: 0, // Initially hotels rating would be 0
    });

    return res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    console.error('Create hotel error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get list of hotels with server-side filtering (public)
// @route   GET /api/hotels
// @access  Public
export const getHotels = async (req, res) => {
  try {
    const { location, priceMin, priceMax, sortBy, searchQuery, features, page, limit, startDate, endDate, onlyAvailable } = req.query;

    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 12;
    const skip = (currentPage - 1) * currentLimit;

    // Build the aggregation pipeline
    const pipeline = [];

    // Stage 1: Date-based Availability Filtering (Advanced)
    // If dates are provided, we find all room IDs that have overlapping confirmed bookings
    let unavailableRoomIds = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Ensure valid dates were provided before querying bookings
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format provided' });
      }

      const overlappingBookings = await Booking.find({
        status: { $in: ['confirmed', 'completed'] },
        $or: [
          { checkInDate: { $lt: end, $gte: start } },
          { checkOutDate: { $gt: start, $lte: end } },
          { $and: [{ checkInDate: { $lte: start } }, { checkOutDate: { $gte: end } }] }
        ]
      }).select('roomId');

      unavailableRoomIds = overlappingBookings.map(b => b.roomId);
    }

    // Stage 2: Lookup rooms for each hotel, excluding unavailable ones
    pipeline.push({
      $lookup: {
        from: 'rooms',
        let: { hotel_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$hotelId', '$$hotel_id'] },
              _id: { $nin: unavailableRoomIds },
              availability: true // Still respect the manual toggle
            }
          }
        ],
        as: 'availableRooms'
      }
    });

    // Stage 3: Add minPrice and availability metrics
    pipeline.push({
      $addFields: {
        minPrice: {
          $cond: {
            if: { $gt: [{ $size: '$availableRooms' }, 0] },
            then: { $min: '$availableRooms.price' },
            else: null
          }
        },
        availableRoomsCount: {
          $size: '$availableRooms'
        },
        totalRoomsCount: {
          $sum: '$availableRooms.totalRooms'
        }
      }
    });

    // Stage 4: Build match conditions for filtering
    const matchConditions = {};

    if (onlyAvailable === 'true') {
      matchConditions.availableRoomsCount = { $gt: 0 };
    }

    if (location && location !== 'Any region') {
      matchConditions.location = { $regex: location, $options: 'i' };
    }

    if (priceMin || priceMax) {
      matchConditions.minPrice = {};
      if (priceMin) matchConditions.minPrice.$gte = Number(priceMin);
      if (priceMax) matchConditions.minPrice.$lte = Number(priceMax);
    }

    if (searchQuery) {
      matchConditions.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (features) {
      const featureList = features.split(',');
      matchConditions.amenities = { $all: featureList };
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Stage 4: Sort results
    let sortStage = {};
    switch (sortBy) {
      case 'Price ascending':
        sortStage = { minPrice: 1 };
        break;
      case 'Price descending':
        sortStage = { minPrice: -1 };
        break;
      case 'Rating & Recommended':
        sortStage = { rating: -1 };
        break;
      default:
        sortStage = { _id: 1 };
    }
    pipeline.push({ $sort: sortStage });

    // Stage 5: Pagination and Total Count using Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: currentLimit }
        ]
      }
    });

    // Execute aggregation
    const result = await Hotel.aggregate(pipeline);
    // FIX: Defensive extraction to handle cases where result might be empty or malformed
    const facetResult = result[0] || { data: [], metadata: [] };
    const hotels = facetResult.data || [];
    const total = facetResult.metadata[0]?.total || 0;

    // Populate manager info for the paginated results
    const hotelsWithManager = await Hotel.populate(hotels, {
      path: 'managerId',
      select: 'name email contactNumber'
    });

    return res.status(200).json({
      success: true,
      data: hotelsWithManager,
      total,
      page: currentPage,
      pages: Math.ceil(total / currentLimit)
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
export const getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('managerId', 'name email contactNumber');
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    console.error('Get hotel error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update hotel (manager or admin)
// @route   PUT /api/hotels/:id
// @access  Private (manager/admin)
export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const isOwner = hotel.managerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the property manager or an admin can update this hotel' });
    }

    const { name, location, description, amenities, image } = req.body;
    if (name) hotel.name = name;
    if (location) hotel.location = location;
    if (description) hotel.description = description;
    if (amenities) hotel.amenities = amenities;
    // Rating should only be computed from reviews, removed from manual update
    if (image) hotel.image = image;

    await hotel.save();

    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    console.error('Update hotel error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete hotel (manager or admin)
// @route   DELETE /api/hotels/:id
// @access  Private (manager/admin)
export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const isOwner = hotel.managerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the property manager or an admin can delete this hotel' });
    }

    // FIX: Complete cascade deletion - delete all related data
    // Step 1: Find all rooms for this hotel
    const rooms = await Room.find({ hotelId: hotel._id });
    const roomIds = rooms.map(r => r._id);

    // Step 2: Find all bookings for those rooms
    const bookings = await Booking.find({ roomId: { $in: roomIds } });
    const bookingIds = bookings.map(b => b._id);

    // Step 3: Delete payments for those bookings
    if (bookingIds.length > 0) {
      await Payment.deleteMany({ bookingId: { $in: bookingIds } });
      // Step 4: Delete redemptions for those bookings
      await Redemption.deleteMany({ bookingId: { $in: bookingIds } });
    }

    // Step 5: Delete bookings
    await Booking.deleteMany({ roomId: { $in: roomIds } });

    // Step 6: Delete reviews for the hotel
    await Review.deleteMany({ hotelId: hotel._id });

    // Step 7: Delete rooms
    await Room.deleteMany({ hotelId: hotel._id });

    // Step 8: Delete the hotel
    await Hotel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Hotel and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
