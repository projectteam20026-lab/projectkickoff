const nodemailer = require('nodemailer');

/**
 * Sends an email via Gmail using Nodemailer.
 * Requires in .env:
 *   EMAIL_USER — your Gmail address
 *   EMAIL_PASS — 16-char Gmail App Password (no spaces)
 *   EMAIL_FROM — display name + address (optional)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER) {
    throw new Error('EMAIL_USER is not set in .env');
  }
  if (!process.env.EMAIL_PASS) {
    throw new Error('EMAIL_PASS is not set in .env');
  }

  console.log(`\n📧 Sending email`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   From:    ${process.env.EMAIL_USER}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      // Strip any spaces from the App Password (common copy-paste mistake)
      pass: String(process.env.EMAIL_PASS).replace(/\s+/g, ''),
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log('   ✅ SMTP connection verified');
  } catch (err) {
    throw new Error(
      `SMTP authentication failed. Check EMAIL_USER and EMAIL_PASS in .env\n   Details: ${err.message}`
    );
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `KickOff Jordan <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`   ✅ Email sent — Message-ID: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
