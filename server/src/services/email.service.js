const https = require('https');
const env = require('../config/env');
const logger = require('../utils/logger');

const baseStyle = `font-family:'Inter',Arial,sans-serif;background-color:#F5F7F6;padding:40px 0;`;
const cardStyle = `max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;`;
const headerStyle = `background:linear-gradient(135deg,#2E7D32,#4CAF50);padding:32px;text-align:center;`;
const otpBoxStyle = `display:inline-block;background:#F5F7F6;border:2px solid #2E7D32;border-radius:12px;padding:16px 32px;font-size:36px;font-weight:800;letter-spacing:8px;color:#2E7D32;font-family:'Courier New',monospace;`;

const buildEmailHTML = ({ greeting, message, otp, footer }) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🌿 PlatePulse</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Smart Food Waste Redistribution</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#2C2C2C;font-size:20px;">${greeting}</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">${message}</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="${otpBoxStyle}">${otp}</span>
      </div>
      <p style="text-align:center;color:#999;font-size:12px;margin:16px 0 0;">⏱ Expires in 10 minutes</p>
    </div>
    <div style="background:#F5F7F6;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;color:#999;font-size:11px;">${footer}</p>
    </div>
  </div>
</div>`;

const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    if (!env.MAILJET_API_KEY || !env.MAILJET_SECRET_KEY) {
      logger.warn('Mailjet not configured — skipping email');
      return resolve();
    }

    const fromEmail = env.EMAIL_FROM || 'urfav.kunaal@gmail.com';
    const fromName = env.EMAIL_FROM_NAME || 'PlatePulse';

    const body = JSON.stringify({
      Messages: [{
        From: { Email: fromEmail, Name: fromName },
        To: [{ Email: to }],
        Subject: subject,
        HTMLPart: html,
      }],
    });

    const auth = Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString('base64');

    const req = https.request(
      {
        hostname: 'api.mailjet.com',
        path: '/v3.1/send',
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Mailjet error ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const sendVerificationOTP = async (email, name, otp) => {
  await sendEmail({
    to: email,
    subject: 'Verify your PlatePulse account',
    html: buildEmailHTML({
      greeting: `Hi ${name},`,
      message: 'Welcome to PlatePulse! Please use the verification code below to confirm your email address.',
      otp,
      footer: "If you didn't create an account, you can safely ignore this email.",
    }),
  });
  logger.info(`Verification OTP sent to ${email}`);
};

const sendPasswordResetOTP = async (email, name, otp) => {
  await sendEmail({
    to: email,
    subject: 'Reset your PlatePulse password',
    html: buildEmailHTML({
      greeting: `Hi ${name},`,
      message: 'We received a request to reset your password. Use the code below to set a new password.',
      otp,
      footer: "If you didn't request a password reset, please ignore this email.",
    }),
  });
  logger.info(`Password reset OTP sent to ${email}`);
};

const sendMatchNotification = async (email, name, donationName, distance) => {
  const html = `
  <div style="${baseStyle}">
    <div style="${cardStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🌿 PlatePulse</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#2C2C2C;">Hi ${name},</h2>
        <p style="color:#666;font-size:14px;line-height:1.6;">
          A new food donation <strong>"${donationName}"</strong> is available just
          <strong>${distance}km</strong> away from you.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${env.CLIENT_URL}/map" style="display:inline-block;background:#2E7D32;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View on Map →</a>
        </div>
      </div>
    </div>
  </div>`;
  await sendEmail({ to: email, subject: 'New food donation nearby — PlatePulse', html });
  logger.info(`Match notification sent to ${email}`);
};

module.exports = { sendVerificationOTP, sendPasswordResetOTP, sendMatchNotification };
