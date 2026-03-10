import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required'],
    },
    hotelName: {
      type: String,
      required: false,
    },
    managerName: {
      type: String,
      required: false,
    },
    managerEmail: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: [true, 'Please provide a room type'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide room capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    totalRooms: {
      type: Number,
      default: 1,
      min: [1, 'Total rooms must be at least 1'],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    features: [String],
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Room', RoomSchema);