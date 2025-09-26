// src/features/admin/routes/index.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listUsers, listPending, getUser, updateUser, deleteUser,
  approveUser, updateRole, createUser
} from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/pending', listPending);
router.get('/users/:userId', getUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/approve', approveUser);
router.patch('/users/:userId/role', updateRole);
router.post('/users', createUser);

export default router;