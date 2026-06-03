const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('ar-JO'),
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['booking', 'system', 'league'],
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
