// src/routes/index.js
import { Router } from 'express';
import authRoutes from '../features/auth/routes/index.js';
import adminRoutes from '../features/admin/routes/index.js';
import projectRoutes from '../features/projects/routes/index.js';
import debugRoutes from '../features/debug/routes/index.js';
// (files feature can be mounted later)

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/projects', projectRoutes);
router.use('/debug', debugRoutes);

export default router;