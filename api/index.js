'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes
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
const paymentRoutes        = require('../backend/src/routes/paymentRoutes');
const friendlyMatchRoutes  = require('../backend/src/routes/friendlyMatches');
const errorHandler         = require('../backend/src/middleware/errorHandler');

// Public tournament controllers (registered directly to avoid router caching issues on Vercel)
const {
  createPublicTournament,
  getTournamentByToken,
  approveByToken,
  rejectByToken,
  updateStatusByToken,
} = require('../backend/src/controllers/tournamentController');

// ── Lazy MongoDB connection (cached across serverless invocations) ──────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in environment variables');
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
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      // Allow any *.vercel.app domain automatically
      if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    // In development, allow all
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── DB connection middleware (runs before every request) ───────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ success: false, error: 'Database connection failed' });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'KickOff Jordan API v2.2',
    timestamp: new Date(),
    env: process.env.NODE_ENV,
  });
});

// ── Debug: list registered tournament routes ────────────────────────────────
app.get('/api/debug/routes', (req, res) => {
  const routes = tournamentRoutes.stack
    .filter(r => r.route)
    .map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} /api/tournaments${r.route.path}`);
  res.json({ routes });
});

// ── Public tournament routes (direct — must be before the router mount) ────
app.post('/api/tournaments/public',                                         createPublicTournament);
app.get('/api/tournaments/manage/:token',                                   getTournamentByToken);
app.post('/api/tournaments/manage/:token/registrations/:regId/approve',     approveByToken);
app.post('/api/tournaments/manage/:token/registrations/:regId/reject',      rejectByToken);
app.patch('/api/tournaments/manage/:token/status',                          updateStatusByToken);

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/fields',        fieldRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/teams',         teamRoutes);
app.use('/api/tournaments',   tournamentRoutes);
app.use('/api/matches',       matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/owner',         ownerRoutes);
app.use('/api/payments',          paymentRoutes);
app.use('/api/friendly-matches',  friendlyMatchRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    debug: { method: req.method, url: req.url, originalUrl: req.originalUrl },
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
