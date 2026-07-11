// src/features/debug/routes/index.js
import { Router } from 'express';
import { seedBasic, resetBasic } from '../controllers/debug.controller.js';
import { isProduction } from '../../../config/env.js';

const router = Router();

router.use((req, res, next) => {
  if (process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  if (isProduction()) {
    const expected = process.env.DEBUG_ROUTE_KEY;
    const provided = req.get('x-debug-key');
    if (!expected || provided !== expected) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  return next();
});

router.post('/seed-basic', seedBasic);
router.post('/reset-basic', resetBasic);

export default router;
