import { Router } from "express";
import { sendMail } from "../lib/mailer.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name = "", email = "", message = "" } = req.body || {};
    const clean = (s) => String(s || "").trim();

    const cname = clean(name);
    const cemail = clean(email);
    const cmessage = clean(message);

    if (!cname || !cemail || !cmessage) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!/\S+@\S+\.\S+/.test(cemail)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    const subject = `New contact: ${cname}`;
    const html = `
      <h2>New Website Inquiry</h2>
      <p><strong>Name:</strong> ${cname}</p>
      <p><strong>Email:</strong> ${cemail}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap">${cmessage}</pre>
    `;
    const text = `New Website Inquiry

Name: ${cname}
Email: ${cemail}

Message:
${cmessage}`;

    // send to your own inbox
    await sendMail({
      to: process.env.SMTP_USER,
      subject,
      text,
      html,
    });

    return res.json({ ok: true });
  } catch (err) {
    // During development, expose a hint so you’re not debugging blind
    const msg = err?.message || "Failed to send";
    if (process.env.NODE_ENV !== "production") {
      console.error("[contact] mail send failed:", msg);
      return res.status(500).json({
        message: "Failed to send (dev hint: " + msg + ")",
      });
    }
    return res.status(500).json({ message: "Failed to send. Please try later." });
  }
});

export default router;