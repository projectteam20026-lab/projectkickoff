const mongoose = require('mongoose');

const friendlyMatchSchema = new mongoose.Schema(
  {
    fromTeamId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    fromTeamName: { type: String, required: true },
    fromTeamLogo: { type: String, default: '' },
    fromUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    toTeamId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    toTeamName: { type: String, required: true },
    toTeamLogo: { type: String, default: '' },
    toUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    proposedDate: { type: String, default: '' },
    proposedTime: { type: String, default: '' },
    venue:        { type: String, default: '' },
    fieldType:    { type: String, default: '7v7' },
    message:      { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FriendlyMatch', friendlyMatchSchema);
