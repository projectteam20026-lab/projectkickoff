const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
    },
    sport: {
      type: String,
      default: 'كرة القدم',
    },
    status: {
      type: String,
      enum: ['التسجيل متاح', 'جارية', 'مكتملة'],
      default: 'التسجيل متاح',
    },
    maxTeams: {
      type: Number,
      default: 8,
    },
    startDate: {
      type: String,
      required: true,
    },
    prizePool: {
      type: String,
      default: '0 JD',
    },
    registeredTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    matchesGenerated: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Virtual: teamsCount
tournamentSchema.virtual('teamsCount').get(function () {
  return this.registeredTeams.length;
});

tournamentSchema.set('toJSON', { virtuals: true });
tournamentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
