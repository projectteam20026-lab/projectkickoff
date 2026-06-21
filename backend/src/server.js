'use strict';

const path    = require('path');
const dotenv  = require('dotenv');

// ─── Load env first (before any other import needs it) ────────────────────────
dotenv.config({ path: path.join(__dirname, '../.env') });

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');

const connectDB      = require('../config/db');
const errorHandler   = require('./middleware/errorHandler');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const fieldRoutes        = require('./routes/fields');
const bookingRoutes      = require('./routes/bookings');
const teamRoutes         = require('./routes/teams');
const tournamentRoutes   = require('./routes/tournaments');
const matchRoutes        = require('./routes/matches');
const notificationRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');
const reviewRoutes       = require('./routes/reviews');
const ownerRoutes        = require('./routes/owner');
const paymentRoutes      = require('./routes/paymentRoutes');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    if (!origin) return callback(null, true);
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin === process.env.CLIENT_URL
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '15mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'KickOff Jordan API v2.0 🚀',
    timestamp: new Date(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
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
app.use('/api/payments',     paymentRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  KickOff Jordan API v2.0`);
  console.log(`    Running on : http://localhost:${PORT}`);
  console.log(`    Health     : http://localhost:${PORT}/api/health`);
  console.log(`    Mode       : ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
