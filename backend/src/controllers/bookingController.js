const Booking = require('../models/Booking');
const Field = require('../models/Field');
const Notification = require('../models/Notification');

// @desc    Get all bookings (admin) or user's bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'مسؤول') {
      query = Booking.find();
    } else if (req.user.role === 'مالك ملعب') {
      // Owner sees bookings for their fields
      const ownerFields = await Field.find({ ownerId: req.user._id }).select('_id');
      const fieldIds = ownerFields.map((f) => f._id);
      query = Booking.find({ fieldId: { $in: fieldIds } });
    } else {
      query = Booking.find({ userId: req.user._id });
    }

    const bookings = await query.populate('userId', 'name email').populate('fieldId', 'name location').sort('-createdAt');
    res.json({ success: true, data: bookings.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { fieldId, date, timeSlot } = req.body;

    if (!fieldId || !date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'fieldId والتاريخ والوقت مطلوبة' });
    }

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ success: false, error: 'الملعب غير موجود' });

    // ─── DUPLICATE BOOKING PREVENTION ───────────────────────────
    const conflict = await Booking.findOne({
      fieldId,
      date,
      timeSlot,
      status: { $ne: 'ملغي' },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'عذراً، هذا الوقت محجوز مسبقاً لهذا الملعب.',
      });
    }
    // ─────────────────────────────────────────────────────────────

    const booking = await Booking.create({
      userId: req.user._id,
      fieldId,
      fieldName: field.name,
      date,
      timeSlot,
      price: field.pricePerHour,
      status: 'مؤكد',
    });

    // Create notification for the user
    await Notification.create({
      userId: req.user._id,
      title: 'تم تأكيد الحجز',
      message: `تم تأكيد حجزك في ${field.name} بتاريخ ${date} - ${timeSlot}`,
      type: 'booking',
      date: new Date().toLocaleDateString('ar-JO'),
    });

    res.status(201).json({ success: true, data: toFrontend(booking) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'الحجز غير موجود' });

    // Only owner of booking or admin can cancel
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بإلغاء هذا الحجز' });
    }

    booking.status = 'ملغي';
    await booking.save();

    // Notification
    await Notification.create({
      userId: booking.userId,
      title: 'تم إلغاء الحجز',
      message: `تم إلغاء حجزك في ${booking.fieldName} بتاريخ ${booking.date}`,
      type: 'booking',
      date: new Date().toLocaleDateString('ar-JO'),
    });

    res.json({ success: true, data: toFrontend(booking) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get available time slots for a field on a date
// @route   GET /api/bookings/slots?fieldId=&date=
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { fieldId, date } = req.query;
    if (!fieldId || !date) {
      return res.status(400).json({ success: false, error: 'fieldId والتاريخ مطلوبان' });
    }

    const ALL_SLOTS = [
      '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
      '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
    ];

    const booked = await Booking.find({ fieldId, date, status: { $ne: 'ملغي' } }).select('timeSlot');
    const bookedSlots = booked.map((b) => b.timeSlot);
    const available = ALL_SLOTS.filter((s) => !bookedSlots.includes(s));

    res.json({ success: true, data: { available, booked: bookedSlots } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(b) {
  return {
    id: b._id,
    fieldId: b.fieldId,
    fieldName: b.fieldName,
    date: b.date,
    timeSlot: b.timeSlot,
    status: b.status,
    price: b.price,
    userId: b.userId,
    createdAt: b.createdAt,
  };
}
