'use strict';
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────────────
    name:         { type: String, required: [true, 'Field name is required'], trim: true },
    slug:         { type: String, trim: true, index: true },
    city:         { type: String, trim: true, index: true },
    region:       { type: String, trim: true },
    location:     { type: String, required: [true, 'Location is required'] },
    address:      { type: String, trim: true },

    // ── Field specs ───────────────────────────────────────────────
    type: {
      type: String,
      enum: ['4v4', '5v5', '6v6', '7v7'],
      required: [true, 'Field type is required'],
    },
    turfType: {
      type: String,
      enum: ['عشب صناعي', 'عشب طبيعي', 'هجين'],
      default: 'عشب صناعي',
    },
    surfaceType: {
      type: String,
      enum: ['Artificial Grass', 'Natural Grass', 'Hybrid'],
      default: 'Artificial Grass',
    },

    // ── Pricing & rating ──────────────────────────────────────────
    pricePerHour: { type: Number, required: [true, 'Price per hour is required'], min: 0 },
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },

    // ── Media & amenities ─────────────────────────────────────────
    images:       { type: [String], default: [] },
    amenities:    { type: [String], default: [] },
    description:  { type: String, default: '' },

    // ── Visibility ────────────────────────────────────────────────
    featured:  { type: Boolean, default: false, index: true },
    isActive:  { type: Boolean, default: true,  index: true },

    // ── Contact ───────────────────────────────────────────────────
    phone:    { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    mapUrl:   { type: String, trim: true },

    // ── Location data ─────────────────────────────────────────────
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // ── Hours ─────────────────────────────────────────────────────
    availableHours: {
      start: { type: String, default: '08:00' },
      end:   { type: String, default: '24:00' },
    },

    // ── Ownership ─────────────────────────────────────────────────
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate slug
fieldSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  if (!this.address && this.location) this.address = this.location;
  next();
});

// Text index for search
fieldSchema.index({ name: 'text', city: 'text', description: 'text' });

module.exports = mongoose.model('Field', fieldSchema);
