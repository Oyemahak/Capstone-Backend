import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Room from "../models/Room.js";
import Project from "../models/Project.js";
import Message from "../models/Message.js";

const router = express.Router();

/** Get messages in a project room */
router.get(
  "/:projectId/messages",
  requireAuth,
  requireRole(["admin", "developer", "client"]),
  async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .select("_id client developer")
      .populate("client", "_id")
      .populate("developer", "_id");

    if (!project) return res.status(404).json({ error: "project not found" });

    const me = String(req.user._id);
    const allowed =
      req.user.role === "admin" ||
      (req.user.role === "developer" &&
        String(project.developer?._id) === me) ||
      (req.user.role === "client" && String(project.client?._id) === me);

    if (!allowed) return res.status(403).json({ error: "forbidden" });

    let room = await Room.findOne({ project: project._id });
    if (!room) room = await Room.create({ project: project._id });

    const { before, limit = 50 } = req.query;
    const q = { kind: "room", project: project._id };
    if (before) q.sentAt = { $lt: new Date(before) };

    const rows = await Message.find(q)
      .sort({ sentAt: -1 })
      .limit(Number(limit));

    res.json({ roomId: room._id, messages: rows.reverse() });
  }
);

/** Send to a project room */
router.post(
  "/:projectId/messages",
  requireAuth,
  requireRole(["admin", "developer", "client"]),
  async (req, res) => {
    const { projectId } = req.params;
    const { text = "", attachments = [] } = req.body;

    const project = await Project.findById(projectId)
      .select("_id client developer")
      .populate("client", "_id")
      .populate("developer", "_id");

    if (!project) return res.status(404).json({ error: "project not found" });

    const me = String(req.user._id);
    const allowed =
      req.user.role === "admin" ||
      (req.user.role === "developer" &&
        String(project.developer?._id) === me) ||
      (req.user.role === "client" && String(project.client?._id) === me);

    if (!allowed) return res.status(403).json({ error: "forbidden" });

    let room = await Room.findOne({ project: project._id });
    if (!room) room = await Room.create({ project: project._id });

    const msg = await Message.create({
      kind: "room",
      room: room._id,
      project: project._id,
      author: req.user._id,
      authorRoleAtSend: req.user.role,
      text: text.trim(),
      attachments,
    });

    room.lastMessageAt = msg.sentAt;
    await room.save();

    req.app.get("io")?.to(`room:${room._id}`).emit("room:new", {
      projectId: String(project._id),
      message: msg,
    });

    res.json({ ok: true, message: msg });
  }
);

export default router;