const Review = require('../models/Review');
const Field = require('../models/Field');

// @desc    Get reviews for a field
// @route   GET /api/reviews?fieldId=xxx
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { fieldId } = req.query;
    if (!fieldId)
      return res.status(400).json({ success: false, error: 'fieldId مطلوب' });

    const reviews = await Review.find({ fieldId })
      .populate('userId', 'name avatar')
      .sort('-createdAt');

    res.json({ success: true, data: reviews.map(fmt), count: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create or update review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { fieldId, rating, comment } = req.body;

    if (!fieldId || !rating)
      return res.status(400).json({ success: false, error: 'fieldId والتقييم مطلوبان' });

    const field = await Field.findById(fieldId);
    if (!field)
      return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    // Upsert: update if exists, create if not
    const review = await Review.findOneAndUpdate(
      { fieldId, userId: req.user._id },
      { rating: Number(rating), comment: comment || '' },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', 'name avatar');

    // Recalculate average
    await Review.calcAverageRating(field._id);

    res.status(201).json({ success: true, data: fmt(review) });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, error: 'لقد قيّمت هذا الملعب مسبقاً' });
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review)
      return res.status(404).json({ success: false, error: 'التقييم غير موجود' });

    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'مسؤول'
    )
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذا التقييم' });

    await review.deleteOne();
    res.json({ success: true, message: 'تم حذف التقييم' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get my review for a field
// @route   GET /api/reviews/my?fieldId=xxx
// @access  Private
exports.getMyReview = async (req, res) => {
  try {
    const { fieldId } = req.query;
    if (!fieldId)
      return res.status(400).json({ success: false, error: 'fieldId مطلوب' });

    const review = await Review.findOne({ fieldId, userId: req.user._id });
    res.json({ success: true, data: review ? fmt(review) : null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function fmt(r) {
  return {
    id: r._id,
    fieldId: r.fieldId,
    userId: r.userId?._id || r.userId,
    userName: r.userId?.name || '',
    userAvatar: r.userId?.avatar || '',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  };
}
