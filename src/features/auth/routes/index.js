// src/features/auth/routes/index.js
import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { login, logout, me, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// NEW
router.post('/register', register);

export default router;