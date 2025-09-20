import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { listUsers, listPending, approveUser, updateRole } from '../controllers/admin.controller.js';

const router = Router();

// Admin only
router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/pending', listPending);
router.patch('/users/:userId/approve', approveUser);
router.patch('/users/:userId/role', updateRole);

export default router;