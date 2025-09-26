// src/features/debug/routes/index.js
import { Router } from 'express';
import { seedBasic, resetBasic } from '../controllers/debug.controller.js';

const router = Router();
// Public for now (you can lock later with requireAuth+requireRole)
router.post('/seed-basic', seedBasic);
router.post('/reset-basic', resetBasic);

export default router;