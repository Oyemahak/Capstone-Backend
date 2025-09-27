// src/features/auth/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../..//models/User.js';

function sign(user) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change-me', { expiresIn: '7d' });
  return token;
}

/** POST /api/auth/login  (existing, keep yours if already working) */
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = sign(user);
  // set http-only cookie as well (optional for your FE which also stores token)
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });

  const safe = user.toObject(); delete safe.password;
  return res.json({ user: safe, token });
}

/** POST /api/auth/logout  (keep your existing if present) */
export async function logout(_req, res) {
  res.clearCookie('token');
  res.json({ ok: true });
}

/** GET /api/auth/me  (keep your existing if present) */
export async function me(req, res) {
  // req.user is set by requireAuth
  res.json({ user: req.user || null });
}

/** NEW: POST /api/auth/register
 * Creates user with status 'pending' and chosen role (client | developer | admin).
 * These will appear in Admin Approvals and must be approved by an admin.
 */
export async function register(req, res) {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const roleNorm = (role || 'client').toLowerCase();
  const allowed = ['client', 'developer', 'admin']; // you asked to allow all three
  const finalRole = allowed.includes(roleNorm) ? roleNorm : 'client';

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.create({
    name,
    email,
    password,       // model pre-save will hash
    role: finalRole,
    status: 'pending',
  });

  const safe = user.toObject(); delete safe.password;
  return res.status(201).json({
    message: 'Registration received. An admin will approve your account.',
    user: safe,
  });
}