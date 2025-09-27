// src/features/admin/controllers/admin.controller.js
import User from '../../../models/User.js';

/** GET /admin/users?status=&q= */
export async function listUsers(req, res) {
  const { q = "", status } = req.query;
  const cond = {};
  if (status) cond.status = status;
  if (q) cond.$or = [
    { name:   { $regex: q, $options: 'i' } },
    { email:  { $regex: q, $options: 'i' } },
  ];
  const users = await User.find(cond).sort({ createdAt: -1 }).select('-password');
  res.json({ users });
}

export async function listPending(_req, res) {
  const users = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
  res.json({ users });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}

export async function createUser(req, res) {
  const { name, email, password, role = 'client', status = 'active' } = req.body;
  const u = await User.create({ name, email, password, role, status });
  const user = await User.findById(u._id).select('-password');
  res.status(201).json({ user });
}

export async function updateUser(req, res) {
  const { userId } = req.params;
  const allowed = ['name', 'role', 'status', 'email', 'password'];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

  const user = await User.findById(userId).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  Object.assign(user, patch);
  await user.save();

  const safe = await User.findById(userId).select('-password');
  res.json({ user: safe });
}

export async function deleteUser(req, res) {
  const { userId } = req.params;
  const user = await User.findByIdAndDelete(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
}

export async function approveUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = 'active';
  await user.save();
  res.json({ user });
}

// Reject semantics: remove if still pending
export async function rejectUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending users can be rejected' });
  }
  await user.deleteOne();
  res.json({ ok: true });
}

export async function updateRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}