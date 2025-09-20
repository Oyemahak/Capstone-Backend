import User from '../../../models/User.js';

export async function listUsers(req, res) {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
}

export async function listPending(req, res) {
  const users = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
  res.json({ users });
}

export async function approveUser(req, res) {
  const { userId } = req.params;
  const user = await User.findByIdAndUpdate(userId, { status: 'active' }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Approved', user });
}

export async function updateRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body; // 'admin' | 'developer' | 'client'
  if (!['admin', 'developer', 'client'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Role updated', user });
}