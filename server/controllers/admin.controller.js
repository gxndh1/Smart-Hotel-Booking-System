import User from '../models/user.model.js';
import Hotel from '../models/hotel.model.js';
import Room from '../models/room.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';

// @desc    Get all users (admin view - includes all roles)
// @route   GET /api/admin/users
// @access  Private (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const usersWithStats = await User.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'userId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' }
        }
      },
      {
        $project: {
          password: 0,
          bookings: 0 // We don't need the actual bookings, just the count
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // If deleting a manager, also delete their hotel and rooms
    if (user.role === 'manager') {
      const hotel = await Hotel.findOne({ managerId: user._id });
      if (hotel) {
        // Delete rooms associated with the hotel
        await Room.deleteMany({ hotelId: hotel._id });
        // Delete the hotel
        await Hotel.findByIdAndDelete(hotel._id);
      }
    }

    // Delete user's bookings
    await Booking.deleteMany({ userId: user._id });

    // Find hotels reviewed by this user before deleting reviews to update their ratings
    const userReviews = await Review.find({ userId: user._id });
    const hotelIdsToUpdate = [...new Set(userReviews.map(r => r.hotelId.toString()))];

    // Delete user's reviews
    await Review.deleteMany({ userId: user._id });

    // Recalculate ratings for all affected hotels
    for (const hId of hotelIdsToUpdate) {
      // Use the static method from the Review model
      await Review.calculateAverageRating(hId);
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `User ${user.name} has been deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const validRoles = ['guest', 'manager', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: guest, manager, admin'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    // FIXED: When promoting a user to manager, auto-create a hotel for them
    if (role === 'manager' && previousRole !== 'manager') {
      // Check if user already has a hotel
      const existingHotel = await Hotel.findOne({ managerId: user._id });

      if (!existingHotel) {
        // Create a default hotel for the new manager
        const newHotel = await Hotel.create({
          name: `${user.name}'s Hotel`,
          location: 'Not Specified',
          managerId: user._id,
          managerEmail: user.email,
          amenities: ['Free WiFi', 'Parking', 'Reception'],
          rating: 0,
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        });

        // Create a default room for the
        await Room.create({
          hotelId: newHotel._id,
          hotelName: newHotel.name,
          managerName: user.name,
          managerEmail: user.email,
          type: 'Standard Room',
          price: 1000,
          capacity: 2,
          availability: true,
          features: ['Free WiFi', 'TV', 'Air Conditioning'],
          image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
        });

        console.log(`Auto-created hotel for new manager: ${user.name}`);
      }
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: userResponse
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all hotels with manager info
// @route   GET /api/admin/hotels
// @access  Private (admin only)
export const getAllHotels = async (req, res) => {
  try {
    const hotelsWithStats = await Hotel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'managerId',
          foreignField: '_id',
          as: 'manager'
        }
      },
      {
        $unwind: {
          path: '$manager',
          preserveNullAndEmptyArrays: true
        }
      },
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
          as: 'bookings'
        }
      },
      {
        $addFields: {
          totalRoomsCount: {
            $sum: {
              $map: {
                input: '$rooms',
                as: 'room',
                in: { $ifNull: ['$$room.totalRooms', { $ifNull: ['$$room.TotalRooms', 1] }] }
              }
            }
          },
          bookingCount: { $size: '$bookings' },
          manager: {
            _id: '$manager._id',
            name: '$manager.name',
            email: '$manager.email',
            contactNumber: '$manager.contactNumber'
          }
        }
      },
      {
        $project: {
          rooms: 0,
          bookings: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: hotelsWithStats
    });
  } catch (error) {
    console.error('Get all hotels error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all bookings with full details (admin view)
// @route   GET /api/admin/bookings
// @access  Private (admin only)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate({
        path: 'roomId',
        populate: {
          path: 'hotelId',
          select: 'name location image'
        }
      })
      .populate('userId', 'name email contactNumber')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    // Transform data for frontend
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
      hotelImage: booking.roomId?.hotelId?.image || '',
      roomId: booking.roomId?._id || booking.roomId,
      roomType: booking.roomId?.type || 'Unknown',
      roomPrice: booking.roomId?.price || 0,
      numberOfRooms: booking.numberOfRooms,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: booking.status,
      extras: booking.extras || [],
      extrasAmount: booking.extrasAmount || 0,
      paymentId: booking.paymentId?._id || booking.paymentId,
      paymentStatus: booking.paymentId?.status || 'pending',
      paymentMethod: booking.paymentId?.paymentMethod || 'N/A',
      paymentAmount: booking.paymentId?.amount || 0,
      loyaltyPointsEarned: Math.floor((booking.roomId?.price || 0) * 0.1),
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: transformedBookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update booking status (admin can approve/reject any booking)
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'roomId',
        populate: { path: 'hotelId' }
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
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
    console.error('Update booking status error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get most booked hotels (analytics)
// @route   GET /api/admin/analytics/most-booked
// @access  Private (admin only)
export const getMostBookedHotels = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate bookings to count by hotel
    const hotelBookings = await Booking.aggregate([
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
        $lookup: {
          from: 'hotels',
          localField: 'room.hotelId',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
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
        $group: {
          _id: '$hotel._id',
          hotelName: { $first: '$hotel.name' },
          hotelLocation: { $first: '$hotel.location' },
          hotelImage: { $first: '$hotel.image' },
          hotelRating: { $first: '$hotel.rating' },
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          successfulBookings: {
            $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'completed']] },
                {
                  $subtract: [
                    {
                      $add: [
                        { $multiply: [{ $multiply: ['$room.price', '$numberOfRooms', { $max: [1, '$nights'] }] }, 1.12 ] },
                        { $ifNull: ['$extrasAmount', 0] }
                      ]
                    },
                    { $ifNull: ['$redemptionDiscountAmount', 0] }
                  ]
                },
                0
              ]
            }
          }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: limit }
    ]);

    // Get room count for each hotel
    const hotelsWithRooms = await Promise.all(
      hotelBookings.map(async (hotel) => {
        const roomCount = await Room.countDocuments({ hotelId: hotel._id });
        return {
          ...hotel,
          roomCount,
          averagePrice: (hotel.confirmedBookings + hotel.completedBookings) > 0
            ? Math.round(hotel.totalRevenue / (hotel.confirmedBookings + hotel.completedBookings))
            : 0
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: hotelsWithRooms
    });
  } catch (error) {
    console.error('Get most booked hotels error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalGuests,
      totalManagers,
      totalAdmins,
      totalHotels,
      totalRooms,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      completedBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'guest' }),
      User.countDocuments({ role: 'manager' }),
      User.countDocuments({ role: 'admin' }),
      Hotel.countDocuments(),
      (async () => {
        const rooms = await Room.find({});
        return rooms.reduce((acc, room) => acc + (room.totalRooms || room.TotalRooms || 1), 0);
      })(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'completed' })
    ]);

    // Calculate total revenue from confirmed bookings
    const revenueData = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
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
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
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
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          guests: totalGuests,
          managers: totalManagers,
          admins: totalAdmins
        },
        hotels: {
          total: totalHotels,
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
        revenue: {
          total: totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all reviews (admin view)
// @route   GET /api/admin/reviews
// @access  Private (admin only)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('userId', 'name email')
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 });

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
    console.error('Get all reviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete review (admin only)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (admin only)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Delete the review
    await Review.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
