import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Manager response fields
    managerReply: {
      type: String,
      default: null,
    },
    managerReplyDate: {
      type: Date,
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Static method to calculate average rating and update hotel
ReviewSchema.statics.calculateAverageRating = async function(hotelId) {
  const stats = await this.aggregate([
    { $match: { hotelId: new mongoose.Types.ObjectId(hotelId) } },
    {
      $group: {
        _id: '$hotelId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
      rating: parseFloat(stats[0].avgRating.toFixed(1)),
      reviewsCount: stats[0].nRating
    });
  } else {
    await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
      rating: 0,
      reviewsCount: 0
    });
  }
};

// Call calculateAverageRating after save (create/update)
ReviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.hotelId);
});

// Call calculateAverageRating after delete (findByIdAndDelete/findOneAndDelete)
ReviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.hotelId);
  }
});

export default mongoose.model('Review', ReviewSchema);
