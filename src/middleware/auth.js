// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (Array.isArray(role)) {
      if (!role.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    } else {
      if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}