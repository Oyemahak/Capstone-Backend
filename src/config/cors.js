// backend/src/config/cors.js
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    try {
      const u = new URL(origin);
      const host = u.hostname;

      if (allowed.includes(origin)) return cb(null, true);
      if (host === 'localhost' || host === '127.0.0.1') return cb(null, true);
      if (host.endsWith('.vercel.app')) return cb(null, true);
      if (host.endsWith('mspixelplus.com')) return cb(null, true);
    } catch (err) {
      console.error('CORS check failed:', err.message);
    }
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};