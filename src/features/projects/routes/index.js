// backend/src/features/projects/routes/index.js
import { Router } from "express";
import * as ctrl from "../controllers/project.controller.js";
import { requireAuth, requireRole } from "../../../middleware/auth.js";

import {
  getRequirement,
  upsertRequirement,
  setReview,
  deleteRequirement,
  memUpload,
} from "../controllers/requirement.controller.js";

const router = Router();

/* Project CRUD */
router.get("/", requireAuth, ctrl.listProjects);
router.get("/:projectId", requireAuth, ctrl.getProject);
router.post("/", requireAuth, requireRole("admin"), ctrl.createProject);
router.patch("/:projectId", requireAuth, ctrl.updateProject);
router.delete("/:projectId", requireAuth, requireRole("admin"), ctrl.deleteProject);

/* Requirements */
router.get("/:projectId/requirements", requireAuth, getRequirement);

// IMPORTANT: allow client to upload/update requirements (additive)
router.put(
  "/:projectId/requirements",
  requireAuth,
  requireRole(["admin", "developer", "client"]),
  memUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "brief", maxCount: 1 },
    { name: "supporting", maxCount: 50 },
    // dynamic pageFiles[Name][] handled in controller
  ]),
  upsertRequirement
);

// Mark reviewed: only Admin/Dev
router.patch(
  "/:projectId/requirements/review",
  requireAuth,
  requireRole(["admin", "developer"]),
  setReview
);

// Admin can clear the entire requirements doc
router.delete(
  "/:projectId/requirements",
  requireAuth,
  requireRole("admin"),
  deleteRequirement
);

/* Evidence: Admin/Dev can append a single entry */
router.post("/:projectId/evidence", requireAuth, ctrl.addEvidence);

/* Announcements: visible to all; create by Admin/Dev */
router.get("/:projectId/announcements", requireAuth, ctrl.listAnnouncements);
router.post("/:projectId/announcements", requireAuth, ctrl.createAnnouncement);
router.delete("/:projectId/announcements/:idx", requireAuth, ctrl.deleteAnnouncement);

export default router;