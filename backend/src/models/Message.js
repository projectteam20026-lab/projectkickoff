const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    teamId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text:     { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
