import { Router } from "express";

// features you already had
import authFeatureRoutes from "../features/auth/routes/index.js";
import adminFeatureRoutes from "../features/admin/routes/index.js";
import projectFeatureRoutes from "../features/projects/routes/index.js";

// new chat & directory
import directoryRoutes from "./directory.js";
import dmRoutes from "./dm.js";
import roomsRoutes from "./rooms.js";

// optional admin audit (default export)
import adminAuditRoutes from "./admin-audit.js";

const router = Router();

// Auth
router.use("/auth", authFeatureRoutes);

// Admin feature
router.use("/admin", adminFeatureRoutes);

// ✅ Mount projects under /projects so /api/projects maps to the list,
// and /api/projects/:projectId maps to details. This prevents
// /api/projects from being captured by a catch-all "/:projectId".
router.use("/projects", projectFeatureRoutes);

// Directory + chat
router.use("/directory", directoryRoutes);
router.use("/dm", dmRoutes);
router.use("/rooms", roomsRoutes);

// Admin audit
router.use("/admin-audit", adminAuditRoutes);

export default router;