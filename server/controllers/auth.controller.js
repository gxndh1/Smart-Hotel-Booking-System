
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Hotel from '../models/hotel.model.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'smart_hotel_booking_system', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, contactNumber } = req.body;

    // Validations
    if (!name || !email || !password || !confirmPassword || !contactNumber) {
      return res.status(400).json({ success: false, message: 'Please fill all fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user - always default to 'guest' role for security
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      contactNumber,
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const lower = email.toLowerCase();
    const user = await User.findOne({ email: lower }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    // Send token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0) // Immediately expire the cookie
  });
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private (admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, contactNumber, address, city, country, dateOfBirth } = req.body;
    const userId = req.user.id;

    if (!name && !contactNumber && !address && !city && !country && !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update'
      });
    }

    if (name) {
      const nameRegex = /^[a-zA-Z\s]{2,}$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'Name must contain only letters and spaces (minimum 2 characters)'
        });
      }
    }

    if (contactNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(contactNumber.replace(/\D/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Contact number must be 10 digits'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (address !== undefined) updateData.address = address;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only check current password if it was provided (standard change flow)
    if (currentPassword) {
      const isPasswordCorrect = await user.matchPassword(currentPassword);

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      user: userResponse,
    });

  } catch (error) {
    console.error('Change password error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Forgot Password (Basic verification)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, contactNumber, newPassword } = req.body;

    if (!email || !contactNumber || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, contact number and new password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Basic verification: check if contact number matches
    if (user.contactNumber !== contactNumber) {
      return res.status(401).json({ success: false, message: 'Invalid verification details' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get user account data with bookings using aggregation
// @route   GET /api/auth/account-data
// @access  Private
export const getUserAccountData = async (req, res) => {
  try {
    const userId = req.user.id;
    const objectId = new mongoose.Types.ObjectId(userId);

    const accountData = await User.aggregate([
      { $match: { _id: objectId } },
      { $project: { password: 0, __v: 0 } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'userId',
          as: 'bookings'
        }
      },
      {
        $unwind: {
          path: '$bookings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'bookings.roomId',
          foreignField: '_id',
          as: 'bookings.room'
        }
      },
      {
        $unwind: {
          path: '$bookings.room',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'bookings.room.hotelId',
          foreignField: '_id',
          as: 'bookings.hotel'
        }
      },
      {
        $unwind: {
          path: '$bookings.hotel',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          email: { $first: '$email' },
          role: { $first: '$role' },
          contactNumber: { $first: '$contactNumber' },
          address: { $first: '$address' },
          city: { $first: '$city' },
          country: { $first: '$country' },
          dateOfBirth: { $first: '$dateOfBirth' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          bookings: { $push: '$bookings' }
        }
      }
    ]);

    if (!accountData || accountData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = accountData[0];

    const response = {
      success: true,
      data: {
        user: {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          contactNumber: userData.contactNumber,
          address: userData.address || '',
          city: userData.city || '',
          country: userData.country || '',
          dateOfBirth: userData.dateOfBirth,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        },
        bookings: userData.bookings.map(booking => ({
          id: booking._id,
          _id: booking._id,
          hotelName: booking.hotel?.name || 'N/A',
          hotel: booking.hotel?.name || 'N/A',
          roomType: booking.room?.type || 'N/A',
          room: booking.room?.type || 'N/A',
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: booking.status,
          numberOfRooms: booking.numberOfRooms,
          price: booking.room?.price || 0,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        }))
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Get account data error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
