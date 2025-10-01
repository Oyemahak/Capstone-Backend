import { Router } from "express";
import * as ctrl from "../controllers/project.controller.js";
import { requireAuth, requireRole } from "../../../middleware/auth.js";

const router = Router();

// Example: list projects (admin sees all; dev sees their own; client sees theirs)
// If you already have your own logic, keep it — just keep paths RELATIVE.
router.get("/", requireAuth, ctrl.listProjects);

// Get one project by id
router.get("/:projectId", requireAuth, ctrl.getProject);

// Create (admin only)
router.post("/", requireAuth, requireRole("admin"), ctrl.createProject);

// Update (admin only or whatever you use)
router.patch("/:projectId", requireAuth, requireRole("admin"), ctrl.updateProject);

// Delete (admin only)
router.delete("/:projectId", requireAuth, requireRole("admin"), ctrl.deleteProject);

export default router;