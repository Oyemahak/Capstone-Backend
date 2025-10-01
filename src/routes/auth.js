import { Router } from 'express';
import {
  login,
  logout,
  me,
  register,
} from '../features/auth/controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/register', register);

export default router;