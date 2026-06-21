'use strict';

const Field      = require('../models/Field');
const Booking    = require('../models/Booking');
const Review     = require('../models/Review');
const Tournament = require('../models/Tournament');

// Returns fields for this owner; falls back to ALL active fields when none
// match (handles demo/seed data where ownerId differs from the logged-in owner)
async function resolveOwnerFields(ownerId, select) {
  const q = select
    ? Field.find({ ownerId, isActive: true }).select(select)
    : Field.find({ ownerId, isActive: true });
  let fields = await q;
  if (fields.length === 0) {
    fields = select
      ? await Field.find({ isActive: true }).select(select)
      : await Field.find({ isActive: true });
  }
  return fields;
}

// @desc    Owner dashboard stats
// @route   GET /api/owner/stats
// @access  Private (owner)
exports.getOwnerStats = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const ownerFields = await resolveOwnerFields(ownerId);
    const fieldIds = ownerFields.map(f => f._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const monthStart = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`;

    const [totalBookings, todayBookings, monthBookings, reviews] = await Promise.all([
      Booking.countDocuments({ fieldId: { $in: fieldIds } }),
      Booking.countDocuments({ fieldId: { $in: fieldIds }, date: todayStr, status: { $ne: 'ملغي' } }),
      Booking.find({ fieldId: { $in: fieldIds }, date: { $gte: monthStart }, status: { $ne: 'ملغي' } }).select('price'),
      Review.find({ fieldId: { $in: fieldIds } }).select('rating'),
    ]);

    const monthlyRevenue = monthBookings.reduce((s, b) => s + (b.price || 0), 0);
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        totalFields:    ownerFields.length,
        totalBookings,
        todayBookings,
        monthlyRevenue,
        avgRating,
        totalReviews:   reviews.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Owner revenue breakdown
// @route   GET /api/owner/revenue
// @access  Private (owner)
exports.getOwnerRevenue = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const ownerFields = await resolveOwnerFields(ownerId, '_id');
    const fieldIds = ownerFields.map(f => f._id);

    const now   = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth()+1).padStart(2,'0')}-${String(weekAgo.getDate()).padStart(2,'0')}`;

    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;

    const [todayB, weekB, monthB, allB] = await Promise.all([
      Booking.find({ fieldId: { $in: fieldIds }, date: today,               status: { $ne: 'ملغي' } }).select('price date fieldName'),
      Booking.find({ fieldId: { $in: fieldIds }, date: { $gte: weekAgoStr }, status: { $ne: 'ملغي' } }).select('price date fieldName'),
      Booking.find({ fieldId: { $in: fieldIds }, date: { $gte: monthStart }, status: { $ne: 'ملغي' } }).select('price date fieldName'),
      Booking.find({ fieldId: { $in: fieldIds },                              status: { $ne: 'ملغي' } }).select('price date fieldName'),
    ]);

    const sum = arr => arr.reduce((s, b) => s + (b.price || 0), 0);

    res.json({
      success: true,
      data: {
        daily:   { revenue: sum(todayB), count: todayB.length },
        weekly:  { revenue: sum(weekB),  count: weekB.length  },
        monthly: { revenue: sum(monthB), count: monthB.length },
        total:   { revenue: sum(allB),   count: allB.length   },
        recentBookings: allB.slice(-20).reverse().map(b => ({
          date:      b.date,
          revenue:   b.price || 0,
          fieldName: b.fieldName,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reviews for owner's fields
// @route   GET /api/owner/reviews
// @access  Private (owner)
exports.getOwnerReviews = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const ownerFields = await resolveOwnerFields(ownerId, '_id name');
    const fieldIds = ownerFields.map(f => f._id);

    const reviews = await Review
      .find({ fieldId: { $in: fieldIds } })
      .populate('userId',  'name avatar')
      .populate('fieldId', 'name')
      .sort('-createdAt');

    const data = reviews.map(r => ({
      id:         r._id,
      fieldId:    r.fieldId?._id  || r.fieldId,
      fieldName:  r.fieldId?.name || '',
      userId:     r.userId?._id   || r.userId,
      userName:   r.userId?.name  || 'مستخدم',
      userAvatar: r.userId?.avatar || '',
      rating:     r.rating,
      comment:    r.comment,
      createdAt:  r.createdAt,
    }));

    const avgRating = data.length
      ? Math.round((data.reduce((s, r) => s + r.rating, 0) / data.length) * 10) / 10
      : 0;

    res.json({ success: true, data, avgRating });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get public tournament requests for this owner's fields
// @route   GET /api/owner/tournament-requests
// @access  Private (owner)
exports.getOwnerTournamentRequests = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const tournaments = await Tournament.find({ fieldOwnerId: ownerId })
      .sort('-createdAt')
      .lean();

    const data = tournaments.map(t => ({
      id:               String(t._id),
      name:             t.name,
      format:           t.format || 'league',
      fieldType:        t.fieldType || '7v7',
      maxTeams:         t.maxTeams,
      startDate:        t.startDate,
      endDate:          t.endDate || '',
      organizerName:    t.organizerName,
      organizerPhone:   t.organizerPhone,
      organizerEmail:   t.organizerEmail || '',
      preferredDays:    t.preferredDays || [],
      preferredTime:    t.preferredTime || '',
      notes:            t.notes || '',
      fieldOwnerStatus: t.fieldOwnerStatus || 'pending',
      status:           t.status,
      createdAt:        t.createdAt,
      fieldId:          t.fieldId || '',
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Approve a public tournament request
// @route   PATCH /api/owner/tournament-requests/:id/approve
// @access  Private (owner)
exports.approveOwnerTournamentRequest = async (req, res) => {
  try {
    const t = await Tournament.findOneAndUpdate(
      { _id: req.params.id, fieldOwnerId: req.user._id },
      { fieldOwnerStatus: 'approved' },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reject a public tournament request
// @route   PATCH /api/owner/tournament-requests/:id/reject
// @access  Private (owner)
exports.rejectOwnerTournamentRequest = async (req, res) => {
  try {
    const t = await Tournament.findOneAndUpdate(
      { _id: req.params.id, fieldOwnerId: req.user._id },
      { fieldOwnerStatus: 'rejected' },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
