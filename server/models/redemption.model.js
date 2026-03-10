import mongoose from 'mongoose';

const RedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    pointsUsed: {
      type: Number,
      required: [true, 'Points used is required'],
      min: [0, 'Points cannot be negative'],
    },
    discountAmount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [0, 'Discount cannot be negative'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Redemption', RedemptionSchema);