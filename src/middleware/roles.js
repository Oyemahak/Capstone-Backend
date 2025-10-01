// Simple role gate used by /rooms, /dm, /directory
export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
};