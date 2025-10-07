// backend/src/features/projects/routes/index.js
import { Router } from "express";
import * as ctrl from "../controllers/project.controller.js";
import { requireAuth, requireRole } from "../../../middleware/auth.js";

import {
  getRequirement,
  upsertRequirement,
  setReview,
  memUpload,
} from "../controllers/requirement.controller.js";

const router = Router();

/* Project CRUD */
router.get("/", requireAuth, ctrl.listProjects);
router.get("/:projectId", requireAuth, ctrl.getProject);
router.post("/", requireAuth, requireRole("admin"), ctrl.createProject);

// IMPORTANT: allow devs to PATCH but controller enforces field-level permissions
router.patch("/:projectId", requireAuth, ctrl.updateProject);

router.delete("/:projectId", requireAuth, requireRole("admin"), ctrl.deleteProject);

/* Requirements */
router.get("/:projectId/requirements", requireAuth, getRequirement);
router.put(
  "/:projectId/requirements",
  requireAuth,
  memUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "brief", maxCount: 1 },
    { name: "supporting", maxCount: 20 },
    // dynamic pageFiles[*] accepted automatically
  ]),
  upsertRequirement
);
router.patch("/:projectId/requirements/review", requireAuth, setReview);

export default router;