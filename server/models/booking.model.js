import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    numberOfRooms: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 room is required'],
      max: [10, 'Maximum 10 rooms can be booked at a time'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    guestEmail: {
      type: String,
      required: false,
    },
    managerEmail: {
      type: String,
      required: false,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    redemptionPointsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Redemption points cannot be negative'],
      max: [500, 'Maximum 500 redemption points can be used at once'],
    },
    redemptionDiscountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    redemptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Redemption',
    },
    additionalGuests: {
      type: [String],
      default: [],
    },
    hotelName: {
      type: String,
      required: false,
    },
    roomType: {
      type: String,
      required: false,
    },
    totalPrice: {
      type: Number,
      required: false,
    },
    guestName: {
      type: String,
      required: false,
    },
    extras: {
      type: [String],
      default: [],
    },
    extrasAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Static method to update room availability based on inventory
BookingSchema.statics.updateRoomAvailability = async function (roomId) {
  const Room = mongoose.model('Room');
  const room = await Room.findById(roomId);

  if (!room) return;

  // Find all rooms of this type in this hotel to calculate true aggregate inventory
  const sameTypeRooms = await Room.find({ 
    hotelId: room.hotelId, 
    type: room.type 
  });
  
  const roomIdsOfType = sameTypeRooms.map(r => r._id);
  const systemMaxRooms = sameTypeRooms.reduce((sum, r) => sum + (r.totalRooms || r.TotalRooms || 1), 0);

  // Group active bookings by room type
  const result = await this.aggregate([
    {
      $match: {
        roomId: { $in: roomIdsOfType },
        status: { $in: ['pending', 'confirmed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalBooked: { $sum: '$numberOfRooms' }
      }
    }
  ]);

  const totalBooked = result.length > 0 ? result[0].totalBooked : 0;

  // If total booked rooms reach or exceed totalRooms, mark all instances of this room type as unavailable
  const isAvailable = totalBooked < systemMaxRooms;

  await Room.updateMany(
    { _id: { $in: roomIdsOfType } }, 
    { $set: { availability: isAvailable } }
  );
};

// Call updateRoomAvailability after a booking is saved (created or status updated)
BookingSchema.post('save', function () {
  this.constructor.updateRoomAvailability(this.roomId);
});

// Call updateRoomAvailability after a booking is updated or deleted via findOneAnd...
BookingSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.updateRoomAvailability(doc.roomId);
  }
});

export default mongoose.model('Booking', BookingSchema);
