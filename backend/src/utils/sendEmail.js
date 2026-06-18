const { Resend } = require('resend');

/**
 * Sends an email via Resend (HTTPS — works on Render).
 * Requires in .env:
 *   RESEND_API_KEY — from resend.com (free tier: 3000 emails/month)
 *   EMAIL_USER     — your sender address (must be verified in Resend)
 *   EMAIL_FROM     — display name + address (optional)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in .env');
  }

  const from = process.env.EMAIL_FROM || `KickOff Jordan <${process.env.EMAIL_USER}>`;

  console.log(`\n📧 Sending email via Resend`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   From:    ${from}`);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`   ✅ Email sent — ID: ${data.id}`);
  return data;
};

module.exports = sendEmail;
