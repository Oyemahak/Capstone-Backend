// src/config/cors.js
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const corsOptions = {
  origin(origin, cb) {
    // Allow same-origin or server-to-server requests
    if (!origin) return cb(null, true);

    try {
      const hostname = new URL(origin).hostname;

      // 1️⃣ Exact allowed origins from .env (comma separated)
      if (allowed.includes(origin)) return cb(null, true);

      // 2️⃣ Allow any Vercel deployment (preview or prod)
      if (hostname.endsWith('.vercel.app')) return cb(null, true);

      // 3️⃣ Allow localhost (frontend dev environment)
      if (hostname === 'localhost' || hostname === '127.0.0.1') return cb(null, true);

      // 4️⃣ (Optional) allow your future custom domain
      if (hostname.endsWith('mspixelplus.com')) return cb(null, true);
    } catch (err) {
      console.error('CORS check failed:', err.message);
    }

    // Otherwise block
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};