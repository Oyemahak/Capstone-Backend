import express from "express";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Devs + Admins can fetch admins & devs directory
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    const users = await User.find({ role: { $in: ["admin", "developer"] } })
      .select("_id name email role status")
      .sort({ role: 1, name: 1 });
    res.json({ users });
  }
);

export default router;