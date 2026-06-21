'use strict';
const FriendlyMatch = require('../models/FriendlyMatch');
const Team          = require('../models/Team');
const Notification  = require('../models/Notification');

// @desc  Send a friendly match request
// @route POST /api/friendly-matches
// @access Private
exports.sendChallenge = async (req, res) => {
  try {
    const { fromTeamId, toTeamId, proposedDate, proposedTime, venue, fieldType, message } = req.body;

    if (!fromTeamId || !toTeamId) {
      return res.status(400).json({ success: false, error: 'من فضلك حدد الفريقين' });
    }
    if (fromTeamId === toTeamId) {
      return res.status(400).json({ success: false, error: 'لا يمكن تحدي فريقك نفسه' });
    }

    const [fromTeam, toTeam] = await Promise.all([
      Team.findById(fromTeamId),
      Team.findById(toTeamId),
    ]);
    if (!fromTeam || !toTeam) {
      return res.status(404).json({ success: false, error: 'فريق غير موجود' });
    }
    if (fromTeam.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'أنت لست مالك هذا الفريق' });
    }

    // Check no pending challenge between these two teams already
    const existing = await FriendlyMatch.findOne({
      fromTeamId, toTeamId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'يوجد تحدٍّ معلق بالفعل مع هذا الفريق' });
    }

    const match = await FriendlyMatch.create({
      fromTeamId,
      fromTeamName: fromTeam.name,
      fromTeamLogo: fromTeam.logo || '',
      fromUserId: req.user._id,
      toTeamId,
      toTeamName: toTeam.name,
      toTeamLogo: toTeam.logo || '',
      toUserId: toTeam.userId,
      proposedDate: proposedDate || '',
      proposedTime: proposedTime || '',
      venue: venue || '',
      fieldType: fieldType || '7v7',
      message: message || '',
    });

    // Notify receiving team owner
    if (toTeam.userId) {
      await Notification.create({
        userId: toTeam.userId,
        title: 'تحدٍّ ودي جديد!',
        message: `فريق "${fromTeam.name}" يتحداك لمباراة ودية${proposedDate ? ` بتاريخ ${proposedDate}` : ''}`,
        type: 'league',
        date: new Date().toLocaleDateString('ar-JO'),
      });
    }

    res.status(201).json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc  Get my friendly matches (sent + received)
// @route GET /api/friendly-matches
// @access Private
exports.getMyMatches = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all teams this user owns
    const myTeams = await Team.find({ userId });
    const myTeamIds = myTeams.map(t => t._id);

    const matches = await FriendlyMatch.find({
      $or: [
        { fromTeamId: { $in: myTeamIds } },
        { toTeamId:   { $in: myTeamIds } },
      ],
    }).sort('-createdAt');

    res.json({ success: true, data: matches.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc  Accept a challenge
// @route POST /api/friendly-matches/:id/accept
// @access Private (toTeam owner)
exports.acceptChallenge = async (req, res) => {
  try {
    const match = await FriendlyMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'التحدي غير موجود' });
    if (match.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'تم البت في هذا التحدي مسبقاً' });
    }

    const toTeam = await Team.findById(match.toTeamId);
    if (!toTeam || toTeam.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'غير مصرح' });
    }

    match.status = 'accepted';
    await match.save();

    // Notify sender
    await Notification.create({
      userId: match.fromUserId,
      title: 'تم قبول تحديك الودي!',
      message: `فريق "${match.toTeamName}" قبل تحديك لمباراة ودية 🎉`,
      type: 'league',
      date: new Date().toLocaleDateString('ar-JO'),
    });

    res.json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc  Reject a challenge
// @route POST /api/friendly-matches/:id/reject
// @access Private (toTeam owner)
exports.rejectChallenge = async (req, res) => {
  try {
    const match = await FriendlyMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'التحدي غير موجود' });
    if (match.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'تم البت في هذا التحدي مسبقاً' });
    }

    const toTeam = await Team.findById(match.toTeamId);
    if (!toTeam || toTeam.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'غير مصرح' });
    }

    match.status = 'rejected';
    await match.save();

    res.json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc  Cancel a challenge (sender only)
// @route POST /api/friendly-matches/:id/cancel
// @access Private (fromTeam owner)
exports.cancelChallenge = async (req, res) => {
  try {
    const match = await FriendlyMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'التحدي غير موجود' });
    if (match.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'لا يمكن إلغاء تحدٍّ غير معلق' });
    }

    const fromTeam = await Team.findById(match.fromTeamId);
    if (!fromTeam || fromTeam.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'غير مصرح' });
    }

    match.status = 'cancelled';
    await match.save();

    res.json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(m) {
  const obj = m.toObject ? m.toObject() : m;
  return {
    id:           obj._id,
    fromTeamId:   obj.fromTeamId,
    fromTeamName: obj.fromTeamName,
    fromTeamLogo: obj.fromTeamLogo,
    fromUserId:   obj.fromUserId,
    toTeamId:     obj.toTeamId,
    toTeamName:   obj.toTeamName,
    toTeamLogo:   obj.toTeamLogo,
    toUserId:     obj.toUserId,
    proposedDate: obj.proposedDate,
    proposedTime: obj.proposedTime,
    venue:        obj.venue,
    fieldType:    obj.fieldType,
    message:      obj.message,
    status:       obj.status,
    createdAt:    obj.createdAt,
  };
}
