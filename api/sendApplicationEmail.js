const nodemailer = require('nodemailer');

function formatApplicationDetails({
  credentialId,
  fullName,
  email,
  location,
  role,
  portfolio,
  outlets,
  statement
}) {
  return [
    `Credential ID: ${credentialId || '—'}`,
    `Full Name: ${fullName || '—'}`,
    `Email: ${email || '—'}`,
    `Location: ${location || '—'}`,
    `Role: ${role || '—'}`,
    `Portfolio Links: ${portfolio || '—'}`,
    `Outlet/Clients: ${outlets || '—'}`,
    `Statement: ${statement || '—'}`
  ].join('\n');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const {
    credentialId,
    fullName,
    email,
    location,
    role,
    portfolio,
    outlets,
    statement
  } = req.body || {};

  if (!fullName || !email || !location || !role || !portfolio || !statement) {
    return res.status(400).json({ error: 'Missing required application fields.' });
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    SMTP_FROM,
    REGISTRY_TEAM_EMAIL
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const registryEmail = REGISTRY_TEAM_EMAIL || 'registry@virelian.org';
  const fromAddress = SMTP_FROM || `Virelian Registry <${registryEmail}>`;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  try {
    const details = formatApplicationDetails({
      credentialId,
      fullName,
      email,
      location,
      role,
      portfolio,
      outlets,
      statement
    });

    await transporter.sendMail({
      from: fromAddress,
      to: registryEmail,
      replyTo: email,
      subject: `New Verification Application: ${fullName}`,
      text: `A new verification application has been submitted.\n\n${details}`
    });

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Virelian verification application received',
      text: `Hello ${fullName},\n\nThank you for submitting your Virelian verification application. Our registry team will review your materials and contact you if we need additional information.\n\nSummary:\n${details}\n\nRegards,\nVirelian Registry`
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to send application emails.' });
  }
};
