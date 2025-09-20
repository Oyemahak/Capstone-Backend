import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { listFiles } from '../controllers/file.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listFiles);

export default router;