const nodemailer = require('nodemailer');
const logger = require('./logger');

const TRANSPORT = process.env.MAIL_TRANSPORT || 'console';
const FROM = process.env.MAIL_FROM || 'NaijaRent <noreply@localhost>';

let transporter = null;
if (TRANSPORT === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function send({ to, subject, text, html }) {
  if (TRANSPORT === 'console') {
    logger.info({ to, subject, text }, '[mailer:console] email would be sent');
    return { ok: true, transport: 'console' };
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, text, html });
    logger.info({ to, subject, messageId: info.messageId }, '[mailer:smtp] sent');
    return { ok: true, transport: 'smtp', id: info.messageId };
  } catch (err) {
    logger.error({ err: err.message, to, subject }, '[mailer:smtp] failed');
    return { ok: false, error: err.message };
  }
}

exports.send = send;

exports.sendPasswordReset = async (user, token) => {
  const url = `${process.env.APP_BASE_URL}/pages/reset-password?token=${token}`;
  return send({
    to: user.email,
    subject: 'Reset your NaijaRent password',
    text: `Hi ${user.name},\n\nReset your password (expires in 30 minutes):\n${url}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Reset your password (expires in 30 minutes):</p><p><a href="${url}">${url}</a></p><p>If you did not request this, ignore this email.</p>`
  });
};

exports.sendEnquiryNotification = async (lister, property, enquiry) => {
  return send({
    to: lister.email,
    subject: `New enquiry: ${property.title}`,
    text: `${enquiry.renterName} (${enquiry.renterPhone}, ${enquiry.renterEmail}) enquired about "${property.title}".\n\nMessage:\n${enquiry.message || '(none)'}`,
    html: `<p><strong>${enquiry.renterName}</strong> (${enquiry.renterPhone}, ${enquiry.renterEmail}) enquired about "<strong>${property.title}</strong>".</p><p>Message:</p><blockquote>${(enquiry.message || '(none)').replace(/</g,'&lt;')}</blockquote>`
  });
};

exports.sendListingApproved = async (user, property) => send({
  to: user.email,
  subject: `Listing approved: ${property.title}`,
  text: `Your listing "${property.title}" has been approved and is now live.`,
  html: `<p>Your listing "<strong>${property.title}</strong>" has been approved and is now live.</p>`
});

exports.sendListingRejected = async (user, property, reason) => send({
  to: user.email,
  subject: `Listing needs changes: ${property.title}`,
  text: `Your listing "${property.title}" was not approved.\n\nReason: ${reason}`,
  html: `<p>Your listing "<strong>${property.title}</strong>" was not approved.</p><p><strong>Reason:</strong> ${reason.replace(/</g,'&lt;')}</p>`
});
