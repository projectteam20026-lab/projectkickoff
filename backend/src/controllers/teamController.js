const Team = require('../models/Team');

// helper: owner id regardless of whether stored in createdBy (new) or userId (legacy)
function ownerOf(team) {
  return (team.createdBy || team.userId)?.toString() || '';
}

// @desc    Get all teams sorted by points (public leaderboard)
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ points: -1 });
    res.json({ success: true, data: teams.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get only the authenticated user's teams
// @route   GET /api/teams/mine
// @access  Private
exports.getMyTeams = async (req, res) => {
  try {
    // support both new (createdBy) and legacy (userId) documents
    const teams = await Team.find({
      $or: [
        { createdBy: req.user._id },
        { userId:    req.user._id },
      ],
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: teams.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
    res.json({ success: true, data: toFrontend(team) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { name, logo, players, city, formation, primaryColor, description, fieldType, captain, ageGroup } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'اسم الفريق مطلوب' });

    const team = await Team.create({
      name,
      createdBy:    req.user._id,
      logo:         logo         || '⚽',
      players:      players      || [],
      city:         city         || '',
      formation:    formation    || '4-3-3',
      primaryColor: primaryColor || '#10b981',
      description:  description  || '',
      fieldType:    fieldType    || '7v7',
      captain:      captain      || '',
      ageGroup:     ageGroup     || 'بالغون (23+)',
    });

    res.status(201).json({ success: true, team: toFrontend(team) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update team (owner or admin only)
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    if (ownerOf(team) !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل هذا الفريق' });
    }

    const { name, logo, city, formation, primaryColor, description, fieldType, captain, ageGroup } = req.body;
    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { name, logo, city, formation, primaryColor, description, fieldType, captain, ageGroup },
      { new: true, runValidators: true }
    );
    res.json({ success: true, team: toFrontend(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete team (owner or admin only)
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    if (ownerOf(team) !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذا الفريق' });
    }

    await team.deleteOne();
    res.json({ success: true, message: 'تم حذف الفريق' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(t) {
  return {
    id:           t._id.toString(),
    name:         t.name,
    wins:         t.wins,
    losses:       t.losses,
    draws:        t.draws,
    points:       t.points,
    logo:         t.logo,
    players:      t.players,
    createdBy:    ownerOf(t),          // works for both new and legacy docs
    city:         t.city,
    formation:    t.formation,
    primaryColor: t.primaryColor,
    description:  t.description,
    fieldType:    t.fieldType,
    captain:      t.captain,
    ageGroup:     t.ageGroup,
  };
}
