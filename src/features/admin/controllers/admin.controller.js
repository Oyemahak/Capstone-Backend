// src/features/admin/controllers/admin.controller.js
import User from '../../../models/User.js';

export async function listUsers(req, res) {
  const { q, status } = req.query;
  const where = {};
  if (status) where.status = status;
  if (q) where.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(where).select('-password').sort({ createdAt: -1 });
  return res.json({ users });
}

export async function listPending(_req, res) {
  const users = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
  return res.json({ users });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
}

export async function updateUser(req, res) {
  const { name, status, role } = req.body || {};
  const patch = {};
  if (typeof name === 'string') patch.name = name;
  if (typeof status === 'string') patch.status = status;
  if (typeof role === 'string') patch.role = role;
  const user = await User.findByIdAndUpdate(req.params.userId, patch, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Updated', user });
}

export async function deleteUser(req, res) {
  const ok = await User.findByIdAndDelete(req.params.userId);
  if (!ok) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Deleted' });
}

export async function approveUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.userId, { status: 'active' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Approved', user });
}

export async function updateRole(req, res) {
  const { role } = req.body || {};
  const allowed = ['admin', 'developer', 'client'];
  if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Role updated', user });
}

/**
 * POST /api/admin/users
 * Body: { name, email, password, role, status }
 * IMPORTANT: pass the PLAIN password — model pre-save will hash.
 */
export async function createUser(req, res) {
  const { name = '', email, password, role = 'client', status = 'active' } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });
  const user = await User.create({ name, email, password, role, status });
  const safe = user.toObject(); delete safe.password;
  return res.status(201).json({ message: 'Created', user: safe });
}