const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    homeTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    awayTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    homeTeam: { type: String, required: true },  // Denormalized name for quick display
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['مجدولة', 'مباشر', 'انتهت'],
      default: 'مجدولة',
    },
    round: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
