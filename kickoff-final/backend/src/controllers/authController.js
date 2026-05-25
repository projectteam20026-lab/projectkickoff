const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const fmt = (u) => ({
  id: u._id, name: u.name, email: u.email,
  phone: u.phone, role: u.role, avatar: u.avatar,
});

// ── POST /api/auth/register ────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
    const user = await User.create({ name, email, password, phone: phone || '', role: role || 'لاعب' });
    res.status(201).json({ success: true, token: generateToken(user._id), user: fmt(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
    res.json({ success: true, token: generateToken(user._id), user: fmt(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: fmt(req.user) });
};

// ── PUT /api/auth/me ───────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    res.json({ success: true, user: fmt(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
    }

    console.log(`\n🔑 Forgot password request for: ${email}`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      console.log('   ℹ️  User not found — returning safe response');
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة خلال دقائق.',
      });
    }

    console.log(`   👤 User found: ${user.name}`);

    // Generate token and save to DB
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    console.log(`   🔐 Reset token generated and saved to DB`);
    console.log(`   🔗 Reset token (plain): ${resetToken}`);

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log(`   🔗 Reset URL: ${resetUrl}`);

    // Build email HTML
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
                  <div style="font-size:36px;margin-bottom:8px;">⚽</div>
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">KickOff Jordan</h1>
                  <p style="color:#d1fae5;margin:4px 0 0;font-size:14px;">إعادة تعيين كلمة المرور</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="color:#1f2937;margin:0 0 16px;font-size:20px;">مرحباً ${user.name} 👋</h2>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px;">
                    تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في KickOff Jordan.
                  </p>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 32px;">
                    انقر على الزر أدناه لإعادة تعيين كلمة المرور. هذا الرابط صالح لمدة <strong>10 دقائق</strong> فقط.
                  </p>

                  <!-- Button -->
                  <div style="text-align:center;margin:0 0 32px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#10b981;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:0.5px;">
                      🔐 إعادة تعيين كلمة المرور
                    </a>
                  </div>

                  <!-- Link fallback -->
                  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 24px;">
                    <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">أو انسخ هذا الرابط في متصفحك:</p>
                    <p style="color:#059669;font-size:12px;margin:0;word-break:break-all;">${resetUrl}</p>
                  </div>

                  <!-- Warning -->
                  <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                    <p style="color:#92400e;font-size:13px;margin:0;">
                      ⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    © ${new Date().getFullYear()} KickOff Jordan — جميع الحقوق محفوظة
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    // Try to send email
    try {
      await sendEmail({
        to: user.email,
        subject: '🔐 KickOff Jordan — إعادة تعيين كلمة المرور',
        html,
      });

      console.log(`   ✅ Email sent successfully to ${user.email}`);
      res.json({
        success: true,
        message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق منه خلال دقائق.',
      });
    } catch (emailErr) {
      // Roll back token if email fails
      console.error(`   ❌ Email failed: ${emailErr.message}`);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // Return a descriptive error for the developer
      return res.status(500).json({
        success: false,
        error: `فشل إرسال البريد الإلكتروني: ${emailErr.message}`,
        hint: 'تأكد من ضبط EMAIL_USER وEMAIL_PASS في ملف .env بشكل صحيح',
      });
    }
  } catch (err) {
    console.error(`❌ forgotPassword error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/auth/reset-password/:token ──────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      });
    }

    // Hash the plain token to compare with the stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log(`\n🔑 Reset password attempt with token: ${req.params.token.substring(0, 16)}...`);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      console.log('   ❌ Token invalid or expired');
      return res.status(400).json({
        success: false,
        error: 'الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.',
      });
    }

    console.log(`   👤 User found: ${user.name} — resetting password`);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log('   ✅ Password reset successfully');

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.',
    });
  } catch (err) {
    console.error(`❌ resetPassword error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
