import mongoose from 'mongoose';

const LoyaltySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    pointsBalance: {
      type: Number,
      default: 0,
      min: [0, 'Points balance cannot be negative'],
    },
    redemptionPointsBalance: {
      type: Number,
      default: 0,
      min: [0, 'Redemption points balance cannot be negative'],
    },
    history: [{
      type: {
        type: String,
        enum: ['earned', 'redeemed', 'purchase', 'refunded', 'cancelled'],
        required: true
      },
      points: {
        type: Number,
        required: true
      },
      description: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
      required: [true, 'lastUpdated is required'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('LoyaltyAccount', LoyaltySchema);
