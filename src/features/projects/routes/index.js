// src/features/projects/routes/index.js
import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import {
  listProjects, getProject, createProject, updateProject, deleteProject
} from '../controllers/project.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listProjects);
router.get('/:projectId', getProject);
router.post('/', createProject);
router.patch('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

export default router;