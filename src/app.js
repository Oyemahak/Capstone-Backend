import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';

import { corsOptions } from './config/cors.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS
app.use(cors(corsOptions));

// Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logs (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root info page (prevents 404 at "/")
app.get('/', (_req, res) => {
  res.type('text').send('MSPixelPulse API is running. Try /health or /api/* endpoints.');
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// API
app.use('/api', apiRouter);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;