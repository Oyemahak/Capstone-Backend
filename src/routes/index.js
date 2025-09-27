// src/routes/index.js
import { Router } from 'express';

// feature routers
import authRoutes from '../features/auth/routes/index.js';
import adminRoutes from '../features/admin/routes/index.js';
import projectRoutes from '../features/projects/routes/index.js';
import fileRoutes from '../features/files/routes/index.js';
import debugRoutes from '../features/debug/routes/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/debug', debugRoutes);

export default router;