const Team = require('../models/Team');

// @desc    Get teams for current user (or all for admin)
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const { all } = req.query;
    let teams;

    if (all === 'true' || req.user.role === 'مسؤول') {
      teams = await Team.find().populate('userId', 'name email');
    } else {
      teams = await Team.find({ userId: req.user._id });
    }

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
    const team = await Team.findById(req.params.id).populate('userId', 'name email');
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
      userId: req.user._id,
      logo: logo || '⚽',
      players: players || [],
      isUserTeam: true,
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

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    if (team.userId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتعديل هذا الفريق' });
    }

    team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, team: toFrontend(team) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });

    if (team.userId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
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
    id: t._id,
    name: t.name,
    wins: t.wins,
    losses: t.losses,
    draws: t.draws,
    points: t.points,
    logo: t.logo,
    players: t.players,
    isUserTeam: t.isUserTeam,
    userId: (t.userId?._id || t.userId)?.toString() || '',
    city:         t.city,
    formation:    t.formation,
    primaryColor: t.primaryColor,
    description:  t.description,
    fieldType:    t.fieldType,
    captain:      t.captain,
    ageGroup:     t.ageGroup,
  };
}
