const allowList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowList.includes(origin)) return cb(null, true);
    cb(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true,
};