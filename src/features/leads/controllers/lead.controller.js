// src/features/leads/controllers/lead.controller.js
import Lead from "../../../models/Lead.js";
import {
  sendMail,
  contactNotificationHTML,
  thankYouHTML,
} from "../../../lib/mailer.js";

export async function createLead(req, res) {
  try {
    const { name = "", email = "", message = "" } = req.body || {};

    const clean = (s) => String(s || "").trim();
    const cname = clean(name);
    const cemail = clean(email);
    const cmessage = clean(message);

    if (!cname || !cemail || !cmessage) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (!/\S+@\S+\.\S+/.test(cemail)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const lead = await Lead.create({
      name: cname,
      email: cemail,
      message: cmessage,
      ip: req.ip,
      ua: req.get("user-agent"),
    });

    // 1) Notify YOU (admin inbox). From must be your account; set replyTo to user.
    await sendMail({
      to: process.env.SMTP_USER,
      replyTo: `${lead.name} <${lead.email}>`,
      subject: `New inquiry from ${lead.name}`,
      html: contactNotificationHTML({
        name: lead.name,
        email: lead.email,
        message: lead.message,
        leadId: lead._id,
      }),
    });

    // 2) Thank-you to the user (best-effort; don’t fail the request if this one fails)
    sendMail({
      to: lead.email,
      subject: "We received your message — MSPixelPulse",
      html: thankYouHTML({ name: lead.name, message: lead.message }),
    }).catch((e) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[lead] thank-you send failed:", e?.message || e);
      }
    });

    return res.status(201).json({ ok: true, leadId: lead._id });
  } catch (err) {
    console.error("[lead] createLead error:", err);
    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
      hint: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
}