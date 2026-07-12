// backend/src/features/users/routes/index.js
import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import {
  upload,
  getMyProfile,
  updateMyProfile,
  setMyAvatar,
  deleteMyAvatar,
} from '../controllers/profile.controller.js';

const router = Router();

// CURRENT USER PROFILE (avatar)
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), setMyAvatar);
router.delete('/me/avatar', requireAuth, deleteMyAvatar);

export default router;
