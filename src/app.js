// backend/src/app.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';

import { corsOptions } from './config/cors.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ───────────────────────────────────────────────
// CORS first (reads from corsOptions in config/cors.js)
// ───────────────────────────────────────────────
app.use(cors(corsOptions));

// Body & cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dev logs (optional in production)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ───────────────────────────────────────────────
// Root info
// ───────────────────────────────────────────────
app.get('/', (_req, res) => {
  res
    .type('text')
    .send('MSPixelPulse API is running. Try /health or /api/* endpoints.');
});

// ───────────────────────────────────────────────
// Health checks for both base and /api paths
// ───────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ✅ IMPORTANT: add this one so frontend wake pings pass
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ───────────────────────────────────────────────
// All API routes (includes /auth, /contact, etc.)
// ───────────────────────────────────────────────
app.use('/api', apiRouter);

// ───────────────────────────────────────────────
// Error handlers
// ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;