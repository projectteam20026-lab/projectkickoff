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
    format:        { type: String, default: 'league' },
    fieldType:     { type: String, default: '7v7' },
    endDate:       { type: String, default: '' },
    regDeadline:   { type: String, default: '' },
    entryFee:      { type: String, default: '0' },
    prize1:        { type: String, default: '' },
    prize2:        { type: String, default: '' },
    prize3:        { type: String, default: '' },
    prizeDesc:     { type: String, default: '' },
    fieldId:       { type: String, default: '' },
    preferredDays: [{ type: String }],
    preferredTime: { type: String, default: 'مسائي' },
    notes:         { type: String, default: '' },
    organizerName:  { type: String, default: '' },
    organizerPhone: { type: String, default: '' },
    organizerEmail: { type: String, default: '' },
    managementToken: { type: String, default: null, index: true },
    pendingRegistrations: [
      {
        teamName:    { type: String, required: true },
        captainName: { type: String, default: '' },
        phone:       { type: String, default: '' },
        email:       { type: String, default: '' },
        playerCount: { type: Number, default: 0 },
        note:        { type: String, default: '' },
        teamId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
        appliedAt:   { type: Date, default: Date.now },
        status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      },
    ],
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
