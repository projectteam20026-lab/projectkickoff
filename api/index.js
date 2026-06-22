'use strict';

const path   = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

// ── Route modules ──────────────────────────────────────────────────────────
const authRoutes         = require('../backend/src/routes/auth');
const fieldRoutes        = require('../backend/src/routes/fields');
const bookingRoutes      = require('../backend/src/routes/bookings');
const teamRoutes         = require('../backend/src/routes/teams');
const tournamentRoutes   = require('../backend/src/routes/tournaments');
const matchRoutes        = require('../backend/src/routes/matches');
const notificationRoutes = require('../backend/src/routes/notifications');
const adminRoutes        = require('../backend/src/routes/admin');
const reviewRoutes       = require('../backend/src/routes/reviews');
const ownerRoutes        = require('../backend/src/routes/owner');
const paymentRoutes      = require('../backend/src/routes/paymentRoutes');
const friendlyMatchRoutes = require('../backend/src/routes/friendlyMatches');
const errorHandler       = require('../backend/src/middleware/errorHandler');

// ── Lazy MongoDB connection ────────────────────────────────────────────────
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
  });
  isConnected = true;
};

// ── Express app ────────────────────────────────────────────────────────────
const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000', 'http://localhost:5173',
  'http://127.0.0.1:3000', 'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV === 'production') {
      if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    }
    cb(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health check (before DB middleware so it always responds) ──────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'KickOff Jordan API v2.5',
    mongo: !!process.env.MONGO_URI ? 'configured' : 'MISSING — set MONGO_URI in Vercel',
    timestamp: new Date(),
  });
});

// ── DB middleware ──────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) {
    const missing = !process.env.MONGO_URI;
    res.status(503).json({
      success: false,
      error: missing
        ? 'MONGO_URI is not set — add it in Vercel Dashboard → Settings → Environment Variables'
        : 'Database connection failed: ' + err.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC TOURNAMENT ROUTES — fully inline, no backend controller dependency
// ══════════════════════════════════════════════════════════════════════════

// POST /api/tournaments/public — create tournament without account
app.post('/api/tournaments/public', async (req, res) => {
  try {
    const {
      name, format, fieldType, maxTeams, startDate, endDate, entryFee,
      prize1, prize2, prize3, prizeDesc, preferredDays, preferredTime,
      notes, fieldId, organizerName, organizerPhone, organizerEmail,
    } = req.body;

    if (!name || !startDate) {
      return res.status(400).json({ success: false, error: 'اسم البطولة وتاريخ البدء مطلوبان' });
    }
    if (!organizerName || !organizerPhone) {
      return res.status(400).json({ success: false, error: 'اسم المنظِّم ورقم هاتفه مطلوبان' });
    }

    const Tournament = mongoose.models.Tournament
      || mongoose.model('Tournament', require('../backend/src/models/Tournament').schema);

    let fieldOwnerId = null;
    if (fieldId) {
      try {
        const Field = mongoose.models.Field
          || mongoose.model('Field', require('../backend/src/models/Field').schema);
        const field = await Field.findById(fieldId).select('ownerId').lean();
        if (field?.ownerId) fieldOwnerId = field.ownerId;
      } catch (_) {}
    }

    const managementToken = crypto.randomBytes(28).toString('hex');

    const TournamentModel = require('../backend/src/models/Tournament');
    const tournament = await TournamentModel.create({
      name: name.trim(),
      format: format || 'league',
      fieldType: fieldType || '7v7',
      maxTeams: parseInt(maxTeams) || 8,
      startDate,
      endDate: endDate || '',
      entryFee: entryFee || '0',
      prize1: prize1 || '', prize2: prize2 || '', prize3: prize3 || '',
      prizeDesc: prizeDesc || '',
      preferredDays: preferredDays || [],
      preferredTime: preferredTime || 'مسائي',
      notes: notes || '',
      fieldId: fieldId || '',
      organizerName: organizerName.trim(),
      organizerPhone: organizerPhone.trim(),
      organizerEmail: organizerEmail?.trim() || '',
      status: 'التسجيل متاح',
      managementToken,
      fieldOwnerId: fieldOwnerId || undefined,
      fieldOwnerStatus: fieldOwnerId ? 'pending' : undefined,
    });

    return res.status(201).json({
      success: true,
      data: { id: tournament._id, name: tournament.name, managementToken },
    });
  } catch (err) {
    console.error('[/api/tournaments/public]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tournaments/manage/:token — get tournament by management token
app.get('/api/tournaments/manage/:token', async (req, res) => {
  try {
    const TournamentModel = require('../backend/src/models/Tournament');
    const t = await TournamentModel.findOne({ managementToken: req.params.token }).lean();
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({
      success: true,
      data: {
        id: t._id, name: t.name, format: t.format, fieldType: t.fieldType,
        maxTeams: t.maxTeams, startDate: t.startDate, endDate: t.endDate,
        entryFee: t.entryFee, prize1: t.prize1, prize2: t.prize2, prize3: t.prize3,
        prizeDesc: t.prizeDesc, preferredDays: t.preferredDays, preferredTime: t.preferredTime,
        notes: t.notes || '', fieldId: t.fieldId, organizerName: t.organizerName,
        organizerPhone: t.organizerPhone, organizerEmail: t.organizerEmail,
        status: t.status, managementToken: t.managementToken,
        pendingRegistrations: t.pendingRegistrations || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tournaments/manage/:token/registrations/:regId/approve
app.post('/api/tournaments/manage/:token/registrations/:regId/approve', async (req, res) => {
  try {
    const TournamentModel = require('../backend/src/models/Tournament');
    const t = await TournamentModel.findOne({ managementToken: req.params.token });
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    const reg = t.pendingRegistrations.id(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    reg.status = 'approved';
    await t.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tournaments/manage/:token/registrations/:regId/reject
app.post('/api/tournaments/manage/:token/registrations/:regId/reject', async (req, res) => {
  try {
    const TournamentModel = require('../backend/src/models/Tournament');
    const t = await TournamentModel.findOne({ managementToken: req.params.token });
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    const reg = t.pendingRegistrations.id(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    reg.status = 'rejected';
    await t.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tournaments/manage/:token/status
app.patch('/api/tournaments/manage/:token/status', async (req, res) => {
  try {
    const TournamentModel = require('../backend/src/models/Tournament');
    const t = await TournamentModel.findOneAndUpdate(
      { managementToken: req.params.token },
      { status: req.body.status },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Remaining API routes ───────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/fields',           fieldRoutes);
app.use('/api/bookings',         bookingRoutes);
app.use('/api/teams',            teamRoutes);
app.use('/api/tournaments',      tournamentRoutes);
app.use('/api/matches',          matchRoutes);
app.use('/api/notifications',    notificationRoutes);
app.use('/api/admin',            adminRoutes);
app.use('/api/reviews',          reviewRoutes);
app.use('/api/owner',            ownerRoutes);
app.use('/api/payments',         paymentRoutes);
app.use('/api/friendly-matches', friendlyMatchRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `[${req.method} ${req.url}] not found`,
    debug: { url: req.url, originalUrl: req.originalUrl },
  });
});

app.use(errorHandler);

module.exports = app;
