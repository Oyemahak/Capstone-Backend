// backend/src/routes/index.js
import { Router } from "express";

// Existing feature mounts
import authFeatureRoutes from "../features/auth/routes/index.js";
import adminFeatureRoutes from "../features/admin/routes/index.js";
import projectFeatureRoutes from "../features/projects/routes/index.js";

// Chat & directory
import directoryRoutes from "./directory.js";
import dmRoutes from "./dm.js";
import roomsRoutes from "./rooms.js";

// Admin audit (optional)
import adminAuditRoutes from "./admin-audit.js";

// Files uploader + invoices (ensure these modules export their own base paths)
import filesRoutes from "./files.routes.js";
import invoiceRoutes from "./invoice.routes.js";

// NEW: user profile routes (avatar)
import userProfileRoutes from "../features/users/routes/index.js";

const router = Router();

// Auth
router.use("/auth", authFeatureRoutes);

// Admin feature
router.use("/admin", adminFeatureRoutes);

// Projects (list/detail)
router.use("/projects", projectFeatureRoutes);

// Directory + chat
router.use("/directory", directoryRoutes);
router.use("/dm", dmRoutes);
router.use("/rooms", roomsRoutes);

// Admin audit
router.use("/admin-audit", adminAuditRoutes);

// Other mounts
router.use(filesRoutes);
router.use(invoiceRoutes);

// NEW: users (me/avatar)
router.use("/users", userProfileRoutes);

export default router;