import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Thread from "../models/Thread.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

// All DM endpoints require auth + (admin or developer)
router.use(requireAuth, requireRole(["admin", "developer"]));

/** Create/ensure a DM thread with peer */
router.post("/open", async (req, res) => {
  const me = String(req.user._id);
  const { peerId } = req.body || {};

  const peer = await User.findById(peerId).select("_id role");
  if (!peer || !["admin", "developer"].includes(peer.role)) {
    return res.status(400).json({ error: "invalid peer" });
  }

  const pair = [me, String(peer._id)].sort();
  let thread = await Thread.findOne({ participants: { $all: pair, $size: 2 } });
  if (!thread) thread = await Thread.create({ participants: pair });

  res.json({ threadId: thread._id });
});

/** List my threads (basic) */
router.get("/threads", async (req, res) => {
  const me = String(req.user._id);
  const threads = await Thread.find({ participants: me }).sort({
    lastMessageAt: -1,
  });
  res.json({ threads });
});

/** Get messages in a thread */
router.get("/threads/:id/messages", async (req, res) => {
  const me = String(req.user._id);
  const thread = await Thread.findById(req.params.id);
  if (!thread || !thread.participants.map(String).includes(me)) {
    return res.status(404).json({ error: "not found" });
  }

  const { before, limit = 50 } = req.query;
  const q = { kind: "dm", thread: thread._id };
  if (before) q.sentAt = { $lt: new Date(before) };

  const msgs = await Message.find(q)
    .sort({ sentAt: -1 })
    .limit(Number(limit));

  res.json({ messages: msgs.reverse() });
});

/** Send a message to a thread */
router.post("/threads/:id/messages", async (req, res) => {
  const me = req.user;
  const thread = await Thread.findById(req.params.id);
  if (!thread || !thread.participants.map(String).includes(String(me._id))) {
    return res.status(404).json({ error: "not found" });
  }

  const { text = "", attachments = [] } = req.body;

  const msg = await Message.create({
    kind: "dm",
    thread: thread._id,
    author: me._id,
    authorRoleAtSend: me.role,
    text: text.trim(),
    attachments,
  });

  thread.lastMessageAt = msg.sentAt;
  await thread.save();

  // Realtime fanout (optional)
  req.app.get("io")?.to(`thread:${thread._id}`).emit("dm:new", {
    threadId: String(thread._id),
    message: msg,
  });

  res.json({ ok: true, message: msg });
});

export default router;