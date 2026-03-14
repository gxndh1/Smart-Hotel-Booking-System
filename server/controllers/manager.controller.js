import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Hotel from '../models/hotel.model.js';
import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';
import Payment from '../models/payment.model.js';
import Redemption from '../models/redemption.model.js';
import Review from '../models/review.model.js';

// @desc    Get manager dashboard stats (only for manager's hotels)
// @route   GET /api/manager/stats
// @access  Private (manager only)
export const getManagerDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find hotels managed by this user
    const hotels = await Hotel.find({ managerId: userObjectId }).lean();
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hotels: { total: 0, rooms: 0 },
          bookings: { total: 0, confirmed: 0, cancelled: 0, pending: 0 },
          revenue: { total: 0 },
          reviews: { total: 0, averageRating: 0 }
        }
      });
    }

    // Get room count
    const totalRooms = await Room.countDocuments({ hotelId: { $in: hotelIds } });

    // Get booking stats
    const rooms = await Room.find({ hotelId: { $in: hotelIds } }).select('_id');
    const roomIds = rooms.map(r => r._id);

    const [totalBookings, confirmedBookings, cancelledBookings, pendingBookings, completedBookings] = await Promise.all([
      Booking.countDocuments({ roomId: { $in: roomIds } }),
      Booking.countDocuments({ roomId: { $in: roomIds }, status: 'confirmed' }),
      Booking.countDocuments({ roomId: { $in: roomIds }, status: 'cancelled' }),
      Booking.countDocuments({ roomId: { $in: roomIds }, status: 'pending' }),
      Booking.countDocuments({ roomId: { $in: roomIds }, status: 'completed' })
    ]);

    // Get 5 most recent bookings for the "Activity Feed"
    const recentBookings = await Booking.find({ roomId: { $in: roomIds } })
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId', select: 'name' }
      })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate total revenue from confirmed bookings
    const revenueData = await Booking.aggregate([
      { $match: { roomId: { $in: roomIds }, status: { $in: ['confirmed', 'completed'] } } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $addFields: {
          nights: {
            $ceil: {
              $divide: [
                { $subtract: [{ $toDate: "$checkOutDate" }, { $toDate: "$checkInDate" }] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $addFields: {
          calculatedRevenue: {
            $subtract: [
              {
                $add: [
                  { $multiply: [{ $multiply: ['$room.price', '$numberOfRooms', { $max: [1, '$nights'] }] }, 1.12 ] },
                  { $ifNull: ['$extrasAmount', 0] }
                ]
              },
              { $ifNull: ['$redemptionDiscountAmount', 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$calculatedRevenue' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Get review stats
    const totalReviews = await Review.countDocuments({ hotelId: { $in: hotelIds } });
    
    // Calculate average rating
    const ratingData = await Hotel.aggregate([
      { $match: { _id: { $in: hotelIds } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = ratingData[0]?.avgRating || 0;

    return res.status(200).json({
      success: true,
      data: {
        hotels: {
          total: hotels.length,
          rooms: totalRooms
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          completed: completedBookings,
          successful: confirmedBookings + completedBookings
        },
        recentActivity: recentBookings.map(b => ({
          _id: b._id,
          userName: b.userId?.name || 'Guest',
          hotelName: b.roomId?.hotelId?.name || b.hotelName || 'Hotel',
          status: b.status,
          amount: b.totalPrice, // Assuming totalPrice is a virtual or calculated field
          createdAt: b.createdAt
        })),
        revenue: {
          total: totalRevenue
        },
        reviews: {
          total: totalReviews,
          averageRating: Math.round(averageRating * 10) / 10
        }
      }
    });
  } catch (error) {
    console.error('Get manager dashboard stats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get manager's hotels
// @route   GET /api/manager/hotels
// @access  Private (manager only)
export const getManagerHotels = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const hotelsWithStats = await Hotel.aggregate([
      { $match: { managerId: userObjectId } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'hotelId',
          as: 'rooms'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'rooms._id',
          foreignField: 'roomId',
          as: 'hotelBookings'
        }
      },
      {
        $addFields: {
          roomCount: { $size: '$rooms' },
          bookingCount: { $size: '$hotelBookings' },
          successfulBookingCount: {
            $size: {
              $filter: {
                input: '$hotelBookings',
                as: 'booking',
                cond: { $in: ['$$booking.status', ['confirmed', 'completed']] }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$hotelBookings',
                    as: 'booking',
                    cond: { $in: ['$$booking.status', ['confirmed', 'completed']] }
                  }
                },
                as: 'booking',
                in: {
                  $let: {
                    vars: {
                      // Find the matching room price natively inside the map
                      roomPrice: {
                        $let: {
                          vars: {
                            matchedRoom: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: '$rooms',
                                    as: 'room',
                                    cond: { $eq: ['$$room._id', '$$booking.roomId'] }
                                  }
                                },
                                0
                              ]
                            }
                          },
                          in: { $ifNull: ['$$matchedRoom.price', 0] }
                        }
                      },
                      nights: {
                        $max: [
                          1,
                          {
                            $ceil: {
                              $divide: [
                                { $subtract: [{ $toDate: "$$booking.checkOutDate" }, { $toDate: "$$booking.checkInDate" }] },
                                1000 * 60 * 60 * 24
                              ]
                            }
                          }
                        ]
                      }
                    },
                    in: {
                      $subtract: [
                        {
                          $add: [
                            { $multiply: [{ $multiply: ['$$roomPrice', { $ifNull: ['$$booking.numberOfRooms', 1] }, '$$nights'] }, 1.12 ] },
                            { $ifNull: ['$$booking.extrasAmount', 0] }
                          ]
                        },
                        { $ifNull: ['$$booking.redemptionDiscountAmount', 0] }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          rooms: 0,
          hotelBookings: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: hotelsWithStats
    });
  } catch (error) {
    console.error('Get manager hotels error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get manager's rooms
// @route   GET /api/manager/rooms
// @access  Private (manager only)
export const getManagerRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find hotels managed by this user
    const hotels = await Hotel.find({ managerId: userObjectId }).select('_id');
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get rooms for manager's hotels with booking counts natively
    const roomsWithStats = await Room.aggregate([
      { $match: { hotelId: { $in: hotelIds } } },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      {
        $unwind: {
          path: '$hotel',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'roomId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
          hotelId: {
            _id: '$hotel._id',
            name: '$hotel.name',
            location: '$hotel.location'
          }
        }
      },
      {
        $project: {
          bookings: 0,
          hotel: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: roomsWithStats
    });
  } catch (error) {
    console.error('Get manager rooms error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get manager's bookings
// @route   GET /api/manager/bookings
// @access  Private (manager only)
export const getManagerBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find hotels managed by this user
    const hotels = await Hotel.find({ managerId: userObjectId }).select('_id');
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get rooms for manager's hotels
    const rooms = await Room.find({ hotelId: { $in: hotelIds } }).select('_id');
    const roomIds = rooms.map(r => r._id);

    // Get bookings for manager's rooms
    const bookings = await Booking.find({ roomId: { $in: roomIds } })
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId', select: 'name location image' }
      })
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });

    // Helper to calculate nights
    const calculateNights = (inDate, outDate) => {
      const diff = new Date(outDate) - new Date(inDate);
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    // Transform data
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingId: booking._id,
      userId: booking.userId?._id || booking.userId,
      userName: booking.userId?.name || 'Unknown',
      userEmail: booking.userId?.email || 'Unknown',
      userPhone: booking.userId?.contactNumber || 'Unknown',
      hotelId: booking.roomId?.hotelId?._id || booking.roomId?.hotelId,
      hotelName: booking.roomId?.hotelId?.name || 'Unknown Hotel',
      hotelLocation: booking.roomId?.hotelId?.location || 'Unknown',
      roomId: booking.roomId?._id || booking.roomId,
      roomType: booking.roomId?.type || 'Unknown',
      roomPrice: booking.roomId?.price || 0,
      numberOfRooms: booking.numberOfRooms,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      extras: booking.extras || [],
      extrasAmount: booking.extrasAmount || 0,
      totalPrice: (
        ((booking.roomId?.price || 0) * booking.numberOfRooms * calculateNights(booking.checkInDate, booking.checkOutDate)) * 1.12
      ) + (booking.extrasAmount || 0) - (booking.redemptionDiscountAmount || 0),
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: transformedBookings
    });
  } catch (error) {
    console.error('Get manager bookings error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update booking status (manager can approve/reject bookings for their hotels)
// @route   PUT /api/manager/bookings/:id/status
// @access  Private (manager only)
export const updateManagerBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find booking
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId' }
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify hotel belongs to this manager
    if (booking.roomId.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // Populate for response
    await booking.populate('userId', 'name email');
    await booking.populate({
      path: 'roomId',
      populate: { path: 'hotelId', select: 'name' }
    });

    return res.status(200).json({
      success: true,
      data: booking,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Update manager booking status error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get manager's reviews
// @route   GET /api/manager/reviews
// @access  Private (manager only)
export const getManagerReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find hotels managed by this user
    const hotels = await Hotel.find({ managerId: userObjectId }).select('_id');
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get reviews for manager's hotels
    const reviews = await Review.find({ hotelId: { $in: hotelIds } })
      .populate('userId', 'name')
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 });

    // Transform data
    const transformedReviews = reviews.map(review => ({
      _id: review._id,
      userId: review.userId?._id || review.userId,
      userName: review.userId?.name || 'Unknown',
      hotelId: review.hotelId?._id || review.hotelId,
      hotelName: review.hotelId?.name || 'Unknown',
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified || false,
      createdAt: review.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: transformedReviews
    });
  } catch (error) {
    console.error('Get manager reviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete manager's review
// @route   DELETE /api/manager/reviews/:id
// @access  Private (manager only)
export const deleteManagerReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find review
    const review = await Review.findById(req.params.id).populate('hotelId');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Verify hotel belongs to this manager
    if (review.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Review.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get manager profile
// @route   GET /api/manager/profile
// @access  Private (manager only)
export const getManagerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get hotel count for this manager
    const hotelCount = await Hotel.countDocuments({ managerId: user._id });

    return res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        hotelCount
      }
    });
  } catch (error) {
    console.error('Get manager profile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update manager's room
// @route   PUT /api/manager/rooms/:id
// @access  Private (manager only)
export const updateManagerRoom = async (req, res) => {
  try {
    const { type, price, availability, capacity, amenities, image, totalRooms } = req.body;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const room = await Room.findById(req.params.id).populate('hotelId');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Verify hotel belongs to this manager
    if (room.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updateData = {};
    if (type) updateData.type = type;
    if (price !== undefined) updateData.price = price;
    if (availability !== undefined) updateData.availability = availability;
    if (capacity) updateData.capacity = capacity;
    if (amenities) updateData.amenities = amenities;
    if (image) updateData.image = image;
    if (totalRooms) updateData.totalRooms = totalRooms;

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedRoom,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Update manager room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete manager's room
// @route   DELETE /api/manager/rooms/:id
// @access  Private (manager only)
export const deleteManagerRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const room = await Room.findById(req.params.id).populate('hotelId');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Verify hotel belongs to this manager
    if (room.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Cascade deletion: Delete associated bookings and their payments/redemptions
    const bookings = await Booking.find({ roomId: room._id });
    const bookingIds = bookings.map(b => b._id);

    if (bookingIds.length > 0) {
      await Payment.deleteMany({ bookingId: { $in: bookingIds } });
      await Redemption.deleteMany({ bookingId: { $in: bookingIds } });
      await Booking.deleteMany({ roomId: room._id });
    }

    await Room.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Room and all associated bookings/payments deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager room error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete a booking (manager only)
// @route   DELETE /api/manager/bookings/:id
// @access  Private (manager only)
export const deleteManagerBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const booking = await Booking.findById(req.params.id).populate({
      path: 'roomId',
      populate: { path: 'hotelId' }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify hotel belongs to this manager
    if (booking.roomId.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete associated payments and redemptions
    await Payment.deleteMany({ bookingId: booking._id });
    await Redemption.deleteMany({ bookingId: booking._id });
    
    // Delete booking
    await Booking.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager booking error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update manager booking details (dates, rooms, etc)
// @route   PUT /api/manager/bookings/:id
// @access  Private (manager only)
export const updateManagerBookingDetails = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, numberOfRooms, status } = req.body;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const booking = await Booking.findById(req.params.id).populate({
      path: 'roomId',
      populate: { path: 'hotelId' }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify hotel belongs to this manager
    if (booking.roomId.hotelId.managerId.toString() !== userObjectId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (checkInDate) booking.checkInDate = checkInDate;
    if (checkOutDate) booking.checkOutDate = checkOutDate;
    if (numberOfRooms) booking.numberOfRooms = numberOfRooms;
    if (status) booking.status = status;

    await booking.save();

    await booking.populate('userId', 'name email');
    await booking.populate({
      path: 'roomId',
      populate: { path: 'hotelId', select: 'name' }
    });

    return res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking details updated successfully'
    });
  } catch (error) {
    console.error('Update manager booking details error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
