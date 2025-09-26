// src/features/auth/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';

function makeToken(user) {
  const payload = { id: user._id, role: user.role };
  const secret = process.env.JWT_SECRET || 'change-me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function sendToken(res, user) {
  const token = makeToken(user);
  const isProd = String(process.env.NODE_ENV) === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd ? (process.env.COOKIE_SECURE === 'true') : false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.status !== 'active' && user.role !== 'admin') {
    return res.status(403).json({ message: 'Account not active' });
  }

  sendToken(res, user);
  const safe = user.toObject();
  delete safe.password;
  res.json({ user: safe });
}

export async function logout(_req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  // If you mounted requireAuth before this, req.user exists.
  // But we allow unauthenticated /auth/me to support "check session" with cookie.
  try {
    // Try reading from cookie token manually if req.user not present
    if (!req.user) {
      // noop: rely on middleware route to enforce when used
    }
  } catch {}
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
}