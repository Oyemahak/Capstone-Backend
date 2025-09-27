// src/features/projects/routes/index.js
import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject, // <-- this must exist & be exported by the controller
} from '../controllers/project.controller.js';

const router = Router();

// You can choose to require auth for admin-only actions.
// Listing and reading can be public if you want; here they’re open:
router.get('/', listProjects);
router.get('/:projectId', getProject);

// Writes are protected
router.post('/', requireAuth, createProject);
router.patch('/:projectId', requireAuth, updateProject);
router.delete('/:projectId', requireAuth, deleteProject);

export default router;