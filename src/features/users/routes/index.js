// backend/src/features/users/routes/index.js
import { Router } from 'express';
import { requireAuth, upload, setMyAvatar, deleteMyAvatar } from '../controllers/profile.controller.js';

const router = Router();

// CURRENT USER PROFILE (avatar)
router.post('/me/avatar', requireAuth, upload.single('avatar'), setMyAvatar);
router.delete('/me/avatar', requireAuth, deleteMyAvatar);

export default router;