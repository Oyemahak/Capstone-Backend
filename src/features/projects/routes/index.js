import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  assignDevelopers,
  addTask,
  listTasks
} from '../controllers/project.controller.js';

const router = Router();

router.use(requireAuth);

// list according to role
router.get('/', listProjects);

// admin creates/updates/assigns
router.post('/', requireRole('admin'), createProject);
router.get('/:projectId', getProject);
router.patch('/:projectId', requireRole('admin'), updateProject);
router.patch('/:projectId/assign', requireRole('admin'), assignDevelopers);

// tasks (admin + developer can add/list; clients can only list)
router.post('/:projectId/tasks', requireRole('admin', 'developer'), addTask);
router.get('/:projectId/tasks', listTasks);

export default router;