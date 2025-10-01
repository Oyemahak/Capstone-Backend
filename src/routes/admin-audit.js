import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = express.Router();

// Admin-only audit of messages (optional)
router.get(
  "/messages",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { kind, author, project, thread, before, limit = 100 } = req.query;
    const q = {};
    if (kind) q.kind = kind;
    if (author) q.author = author;
    if (project) q.project = project;
    if (thread) q.thread = thread;
    if (before) q.sentAt = { $lt: new Date(before) };

    const rows = await Message.find(q)
      .sort({ sentAt: -1 })
      .limit(Number(limit));
    res.json({ messages: rows });
  }
);

export default router;