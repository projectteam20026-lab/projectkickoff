const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wins:   { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws:  { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    logo: {
      type: String,
      default: '⚽',
    },
    players:      { type: [String], default: [] },
    city:         { type: String, default: '' },
    formation:    { type: String, default: '4-3-3' },
    primaryColor: { type: String, default: '#10b981' },
    description:  { type: String, default: '' },
    fieldType:    { type: String, default: '7v7' },
    captain:      { type: String, default: '' },
    ageGroup:     { type: String, default: 'بالغون (23+)' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
