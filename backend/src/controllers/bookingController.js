const Booking      = require('../models/Booking');
const Field        = require('../models/Field');
const Notification = require('../models/Notification');
const sendEmail    = require('../utils/sendEmail');

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

    // Create in-app notification
    await Notification.create({
      userId: req.user._id,
      title: 'تم تأكيد الحجز',
      message: `تم تأكيد حجزك في ${field.name} بتاريخ ${date} - ${timeSlot}`,
      type: 'booking',
      date: new Date().toLocaleDateString('ar-JO'),
    });

    // Send confirmation email — fire-and-forget; never block the booking response
    const bookingRef = `BK-${String(booking._id).slice(-6).toUpperCase()}`;
    console.log(`📧 Attempting booking email → ${req.user.email} (user: ${req.user.name})`);
    sendEmail({
      to:      req.user.email,
      subject: '⚽ تأكيد الحجز — KickOff Jordan',
      html:    bookingConfirmationEmail({
        userName:   req.user.name,
        fieldName:  field.name,
        date,
        timeSlot,
        price:      field.pricePerHour,
        bookingRef,
      }),
    })
      .then(() => console.log(`📧 ✅ Booking email sent to ${req.user.email}`))
      .catch(err => console.error(`📧 ❌ Booking email FAILED for ${req.user.email}:`, err.message));

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

function bookingConfirmationEmail({ userName, fieldName, date, timeSlot, price, bookingRef }) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#10b981,#0d9488);padding:40px 40px 32px;text-align:center">
            <div style="font-size:40px;margin-bottom:12px">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px">KickOff Jordan</h1>
            <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px">تأكيد الحجز</p>
          </td>
        </tr>

        <!-- Green tick banner -->
        <tr>
          <td style="background:#ecfdf5;border-bottom:2px solid #d1fae5;padding:20px 40px;text-align:center">
            <span style="display:inline-flex;align-items:center;gap:10px;color:#059669;font-size:17px;font-weight:700">
              <span style="background:#10b981;color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-size:14px">✓</span>
              تم تأكيد حجزك بنجاح
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 24px;color:#334155;font-size:16px">مرحباً <strong>${userName}</strong>،</p>
            <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.7">
              يسعدنا إبلاغك بأن حجزك قد تم تأكيده بنجاح. إليك تفاصيل الحجز:
            </p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:28px">
              <tr style="border-bottom:1px solid #e2e8f0">
                <td style="padding:14px 20px;color:#64748b;font-size:13px;width:40%">🏟️ الملعب</td>
                <td style="padding:14px 20px;color:#0f172a;font-size:14px;font-weight:700">${fieldName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0">
                <td style="padding:14px 20px;color:#64748b;font-size:13px">📅 التاريخ</td>
                <td style="padding:14px 20px;color:#0f172a;font-size:14px;font-weight:700">${date}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0">
                <td style="padding:14px 20px;color:#64748b;font-size:13px">⏰ الوقت</td>
                <td style="padding:14px 20px;color:#0f172a;font-size:14px;font-weight:700" dir="ltr">${timeSlot}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0">
                <td style="padding:14px 20px;color:#64748b;font-size:13px">💰 السعر</td>
                <td style="padding:14px 20px;color:#10b981;font-size:15px;font-weight:800">${price} JD</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#64748b;font-size:13px">🔖 رقم الحجز</td>
                <td style="padding:14px 20px">
                  <span style="background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px">${bookingRef}</span>
                </td>
              </tr>
            </table>

            <!-- Note -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-right:4px solid #3b82f6;border-radius:0 10px 10px 0;padding:0;margin-bottom:28px">
              <tr><td style="padding:14px 18px;color:#1d4ed8;font-size:13px;line-height:1.6">
                📌 يرجى التواجد قبل موعدك بـ <strong>15 دقيقة</strong>. الدفع يكون نقداً عند الوصول.
              </td></tr>
            </table>

            <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7">
              نتمنى لك تجربة رياضية ممتعة 🎉<br>
              فريق <strong>KickOff Jordan</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px">
              هذا بريد تأكيد تلقائي — لا تحتاج للرد عليه.<br>
              © 2026 KickOff Jordan · الأردن
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
