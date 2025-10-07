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

// CORS first
app.use(cors(corsOptions));

// Body & cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dev logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root info
app.get('/', (_req, res) => {
  res
    .type('text')
    .send('MSPixelPulse API is running. Try /health or /api/* endpoints.');
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// All API routes (includes files + invoices via routes/index.js)
app.use('/api', apiRouter);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;