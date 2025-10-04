// src/lib/mailer.js
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 465);
const secure = port === 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `"MSPixelPulse" <${user}>`;

if (!user || !pass) {
  console.warn("⚠️  SMTP_USER/SMTP_PASS not set. Email sending will fail.");
}

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log(`📬 [mailer] SMTP ready as ${user}`);
  } catch (err) {
    console.warn("❌ [mailer] SMTP verify failed:", err?.message || err);
  }
}

/** sendMail({ to, subject, text, html, replyTo }) */
export async function sendMail({ to, subject, text, html, replyTo }) {
  return transporter.sendMail({
    from,        // must be your authenticated account (Gmail rule)
    to,
    replyTo,     // this is how “reply” goes to the user
    subject,
    text,
    html,
  });
}

export function contactNotificationHTML({ name, email, message, leadId }) {
  const safeMsg = String(message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;line-height:1.5">
    <h2 style="margin:0 0 8px">New Website Inquiry</h2>
    <p style="margin:0 0 4px"><strong>Name:</strong> ${name}</p>
    <p style="margin:0 0 4px"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p style="margin:12px 0 4px"><strong>Message:</strong></p>
    <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;padding:12px">${safeMsg}</div>
    <p style="margin:12px 0 0;color:#475569;font-size:12px">Lead ID: ${leadId}</p>
  </div>`;
}

export function thankYouHTML({ name, message }) {
  const safeMsg = String(message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;line-height:1.6">
    <h2 style="margin:0 0 8px">Thanks for contacting MSPixelPulse</h2>
    <p style="margin:0 0 8px">Hi ${name},</p>
    <p style="margin:0 0 8px">We’ve received your message and will get back to you within one business day.</p>
    <p style="margin:12px 0 4px"><strong>Your message</strong></p>
    <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;padding:12px">${safeMsg}</div>
    <p style="margin:16px 0 0;color:#475569;font-size:12px">— The MSPixelPulse Team</p>
  </div>`;
}