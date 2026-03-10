import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import Hotel from '../models/hotel.model.js';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import Redemption from '../models/redemption.model.js';
import User from '../models/user.model.js';

// @desc    Create room under a hotel (manager/admin)
// @route   POST /api/rooms
// @access  Private (manager/admin)
export const createRoom = async (req, res) => {
  try {
    const { hotelId, type, price, features, image, capacity } = req.body;

    if (!hotelId || !type || price === undefined) {
      return res.status(400).json({ success: false, message: 'hotelId, type and price are required' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    if (hotel.managerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to add room to this hotel' });
    }

    // Fetch manager details
    const manager = await User.findById(hotel.managerId).select('name email');

    const room = await Room.create({
      hotelId,
      hotelName: hotel.name,
      managerName: manager ? manager.name : '',
      managerEmail: manager ? manager.email : '',
      type,
      price,
      capacity: capacity || 1,
      availability: true,
      features: features || [],
      image: image || '',
    });

    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all rooms (public, with optional hotel filter)
// @route   GET /api/rooms
// @access  Public
export const getRooms = async (req, res) => {
  try {
    const { hotelId } = req.query;

    let matchStage = {};
    // Only count pending bookings from the last 15 minutes to avoid permanent lockouts
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (hotelId) {
      // Validate if hotelId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return res.status(400).json({ success: false, message: 'Invalid hotelId format' });
      }
      matchStage = { hotelId: new mongoose.Types.ObjectId(hotelId) };
    }

    // Use aggregation to get rooms with hotel details
    const rooms = await Room.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotelData'
        }
      },
      { $unwind: { path: '$hotelData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'bookings',
          let: { roomId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$roomId', '$$roomId'] },
                $or: [
                  { status: { $in: ['confirmed', 'completed'] } },
                  { status: 'pending', createdAt: { $gte: fifteenMinsAgo } }
                ]
              }
            }
          ],
          as: 'activeBookings'
        }
      },
      {
        $project: {
          _id: 1,
          hotelId: {
            _id: '$hotelData._id',
            name: '$hotelData.name',
            location: '$hotelData.location',
            rating: '$hotelData.rating'
          },
          type: 1,
          price: 1,
          capacity: 1,
          availability: 1,
          features: 1,
          totalRooms: { $ifNull: ['$totalRooms', { $ifNull: ['$TotalRooms', 1] }] },
          activeBookingsCount: { $sum: '$activeBookings.numberOfRooms' },
          roomsLeft: {
            $max: [0, {
              $subtract: [
                { $ifNull: ['$totalRooms', { $ifNull: ['$TotalRooms', 1] }] },
                { $sum: '$activeBookings.numberOfRooms' }
              ]
            }]
          },
          image: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
export const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotelId', 'name location rating amenities');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    console.error('Get room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update room (manager/admin)
// @route   PUT /api/rooms/:id
// @access  Private (manager/admin)
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotelId');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const isOwner = room.hotelId.managerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this room' });
    }

    const { type, price, availability, features, image, capacity } = req.body;
    if (type) room.type = type;
    if (price !== undefined) room.price = price;
    if (capacity !== undefined) room.capacity = capacity;
    if (availability !== undefined) room.availability = availability;
    if (features) room.features = features;
    if (image) room.image = image;

    await room.save();
    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    console.error('Update room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete room (manager/admin)
// @route   DELETE /api/rooms/:id
// @access  Private (manager/admin)
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotelId');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const isOwner = room.hotelId.managerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this room' });
    }

    // FIX: Complete cascade deletion for room
    // Step 1: Find all bookings for this room
    const bookings = await Booking.find({ roomId: room._id });
    const bookingIds = bookings.map(b => b._id);

    // Step 2: Delete payments for those bookings
    if (bookingIds.length > 0) {
      await Payment.deleteMany({ bookingId: { $in: bookingIds } });
      // Step 3: Delete redemptions for those bookings
      await Redemption.deleteMany({ bookingId: { $in: bookingIds } });
    }

    // Step 4: Delete bookings
    await Booking.deleteMany({ roomId: room._id });

    await Room.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
