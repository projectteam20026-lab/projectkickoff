const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: [true, 'Field ID is required'],
    },
    fieldName: {
      type: String,
      required: true,
    },
    date: {
      type: String, // stored as "YYYY-MM-DD" to match frontend
      required: [true, 'Date is required'],
    },
    timeSlot: {
      type: String, // e.g. "18:00 - 19:00"
      required: [true, 'Time slot is required'],
    },
    status: {
      type: String,
      enum: ['مؤكد', 'قيد الانتظار', 'ملغي'],
      default: 'مؤكد',
    },
    price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['كاش', 'فيزا', 'غير محدد'],
      default: 'كاش',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid'],
      default: 'unpaid',
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index: prevent double booking (same field + date + timeSlot, not cancelled)
// We enforce this in the controller logic for flexibility with 'ملغي' status
bookingSchema.index({ fieldId: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
