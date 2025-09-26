// src/config/cors.js
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (allowed.includes(origin)) return cb(null, true);
      if (hostname.endsWith('.vercel.app')) return cb(null, true);
    } catch {}
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};