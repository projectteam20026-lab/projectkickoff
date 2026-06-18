const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set in environment');

  const rawFrom = process.env.EMAIL_FROM || `KickOff Jordan <projectteam20026@gmail.com>`;
  const match = rawFrom.match(/^(.+?)\s*<(.+?)>$/);
  const sender = match
    ? { name: match[1].trim(), email: match[2].trim() }
    : { email: rawFrom.trim() };

  console.log(`\n📧 Sending email via Brevo`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   From:    ${rawFrom}`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo error: ${data.message || JSON.stringify(data)}`);
  }

  console.log(`   ✅ Email sent — messageId: ${data.messageId}`);
  return data;
};

module.exports = sendEmail;
