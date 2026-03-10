import mongoose from 'mongoose';

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a hotel name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a manager ID'],
    },
    managerEmail: {
      type: String,
      required: false,
    },
    amenities: [String],
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Hotel', HotelSchema);
