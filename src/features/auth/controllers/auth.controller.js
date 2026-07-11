// backend/src/features/auth/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';
import { jwtSecret, signToken } from '../../../utils/jwt.js';
import { boolEnv, isProduction } from '../../../config/env.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction() || boolEnv('COOKIE_SECURE', false),
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  return null;
}

// POST /api/auth/register
export async function register(req, res) {
  const { name = '', email = '', password = '', role = 'client' } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password are required' });

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const u = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,               // client/developer/admin
    status: 'pending',  // <-- requests must be approved by Admin
  });

  const user = await User.findById(u._id).select('-password');
  res.status(201).json({ user });
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email = '', password = '' } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active. Please contact an administrator.' });
    }

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    const safe = await User.findById(user._id).select('-password');
    return res.json({ token, user: safe });
  } catch (err) {
    console.error('Login error:', err.code || 'LOGIN_FAILURE');
    return res.status(err.status || 500).json({ message: 'Login failed' });
  }
}

// POST /api/auth/logout
export async function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
}

// GET /api/auth/me
export async function me(req, res) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, jwtSecret());
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
