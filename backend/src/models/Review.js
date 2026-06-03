const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: [true, 'Field ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// One review per user per field
reviewSchema.index({ fieldId: 1, userId: 1 }, { unique: true });

// After save/remove, recalculate field average rating
reviewSchema.statics.calcAverageRating = async function (fieldId) {
  const stats = await this.aggregate([
    { $match: { fieldId } },
    { $group: { _id: '$fieldId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const Field = require('./Field');
  if (stats.length > 0) {
    await Field.findByIdAndUpdate(fieldId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Field.findByIdAndUpdate(fieldId, { rating: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.fieldId);
});

reviewSchema.post('deleteOne', { document: true }, function () {
  this.constructor.calcAverageRating(this.fieldId);
});

module.exports = mongoose.model('Review', reviewSchema);
