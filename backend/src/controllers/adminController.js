const User       = require('../models/User');
const Booking    = require('../models/Booking');
const Field      = require('../models/Field');
const Team       = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match      = require('../models/Match');
const Notification = require('../models/Notification');

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone,
  role: u.role, avatar: u.avatar, createdAt: u.createdAt,
});

// ═══════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [users, bookings, fields, teams, tournaments] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Field.countDocuments({ isActive: true }),
      Team.countDocuments(),
      Tournament.countDocuments(),
    ]);
    const activeBookings   = await Booking.countDocuments({ status: 'مؤكد' });
    const cancelledBookings = await Booking.countDocuments({ status: 'ملغي' });
    res.json({ success: true, data: { users, bookings, fields, teams, tournaments, activeBookings, cancelledBookings } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, data: users.map(fmtUser), count: users.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'لا يمكنك حذف حسابك الخاص' });
    await user.deleteOne();
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['لاعب', 'مالك ملعب', 'مسؤول'];
    if (!allowed.includes(role))
      return res.status(400).json({ success: false, error: 'دور غير صالح' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    res.json({ success: true, data: fmtUser(user) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email avatar')
      .populate('fieldId', 'name location')
      .sort('-createdAt');
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// PUT /api/admin/bookings/:id   (approve/reject/status change)
exports.updateBooking = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['مؤكد', 'قيد الانتظار', 'ملغي'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, error: 'حالة غير صالحة' });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('userId', 'name email')
      .populate('fieldId', 'name location');
    if (!booking) return res.status(404).json({ success: false, error: 'الحجز غير موجود' });

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: status === 'مؤكد' ? 'تم تأكيد حجزك' : 'تم رفض حجزك',
      message: `حجزك في ${booking.fieldName} بتاريخ ${booking.date} — الحالة: ${status}`,
      type: 'booking',
      date: new Date().toLocaleDateString('ar-JO'),
    });

    res.json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'الحجز غير موجود' });
    await booking.deleteOne();
    res.json({ success: true, message: 'تم حذف الحجز' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════
// FIELDS
// ═══════════════════════════════════════════════════════════════════════════

const FIELD_IMG = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop';
const fmtField = (f) => ({
  id: f._id, name: f.name, location: f.location, pricePerHour: f.pricePerHour,
  rating: f.rating, type: f.type, turfType: f.turfType, images: f.images,
  amenities: f.amenities, description: f.description, ownerId: f.ownerId, isActive: f.isActive,
});

// GET /api/admin/fields
exports.getFields = async (req, res) => {
  try {
    const fields = await Field.find().populate('ownerId', 'name email').sort('-createdAt');
    res.json({ success: true, data: fields.map(fmtField), count: fields.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/admin/fields
exports.createField = async (req, res) => {
  try {
    const { name, location, pricePerHour, type, turfType, amenities, description } = req.body;
    if (!name || !location || !pricePerHour || !type)
      return res.status(400).json({ success: false, error: 'الاسم والموقع والسعر والنوع مطلوبة' });
    const field = await Field.create({
      name, location, pricePerHour, type,
      turfType: turfType || 'عشب صناعي',
      images: [FIELD_IMG],
      amenities: amenities || [],
      description: description || '',
      ownerId: req.user._id,
    });
    res.status(201).json({ success: true, data: fmtField(field) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// PUT /api/admin/fields/:id
exports.updateField = async (req, res) => {
  try {
    const field = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });
    res.json({ success: true, data: fmtField(field) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/fields/:id
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });
    await Field.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'تم حذف الملعب' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('userId', 'name email').sort('-createdAt');
    res.json({ success: true, data: teams, count: teams.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, error: 'الفريق غير موجود' });
    await team.deleteOne();
    res.json({ success: true, message: 'تم حذف الفريق' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/tournaments
exports.getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('registeredTeams', 'name logo')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: tournaments, count: tournaments.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/admin/tournaments
exports.createTournament = async (req, res) => {
  try {
    const { name, sport, maxTeams, startDate, prizePool } = req.body;
    if (!name || !startDate)
      return res.status(400).json({ success: false, error: 'اسم البطولة وتاريخ البدء مطلوبان' });
    const t = await Tournament.create({
      name, sport: sport || 'كرة القدم',
      maxTeams: maxTeams || 8, startDate,
      prizePool: prizePool || '0 JD',
      status: 'التسجيل متاح',
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: t });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// PUT /api/admin/tournaments/:id
exports.updateTournament = async (req, res) => {
  try {
    const t = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({ success: true, data: t });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/tournaments/:id
exports.deleteTournament = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    await Match.deleteMany({ leagueId: req.params.id });
    await t.deleteOne();
    res.json({ success: true, message: 'تم حذف البطولة ومبارياتها' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/admin/tournaments/:id/add-team
exports.addTeamToTournament = async (req, res) => {
  try {
    const { teamId } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    if (tournament.registeredTeams.some(t => t.toString() === teamId))
      return res.status(400).json({ success: false, error: 'الفريق مسجل مسبقاً' });
    tournament.registeredTeams.push(teamId);
    await tournament.save();
    res.json({ success: true, data: tournament });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// DELETE /api/admin/tournaments/:id/remove-team/:teamId
exports.removeTeamFromTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    tournament.registeredTeams = tournament.registeredTeams.filter(
      t => t.toString() !== req.params.teamId
    );
    await tournament.save();
    res.json({ success: true, data: tournament });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
