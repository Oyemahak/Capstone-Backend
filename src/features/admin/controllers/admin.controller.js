// src/features/admin/controllers/admin.controller.js
import User from '../../../models/User.js';

const ADMIN_ONLY_FIELDS = ['isSuperAdmin', 'isProtected', 'accountStatus', 'protectedReason'];
const PROTECTED_MUTATION_FIELDS = ['role', 'status', 'email', 'password', ...ADMIN_ONLY_FIELDS];
const VALID_ROLES = ['admin', 'developer', 'client'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isProtectedAccount(user) {
  return Boolean(user?.isSuperAdmin || user?.isProtected);
}

function hasForbiddenField(body, fields) {
  return fields.some((field) => Object.prototype.hasOwnProperty.call(body || {}, field));
}

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
  if (hasForbiddenField(req.body, ADMIN_ONLY_FIELDS)) {
    return res.status(403).json({ message: 'Protected account fields cannot be set from the admin UI' });
  }

  const { name, email, password, role = 'client', status = 'active' } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const u = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    status,
    accountStatus: status,
  });
  const user = await User.findById(u._id).select('-password');
  res.status(201).json({ user });
}

export async function updateUser(req, res) {
  const { userId } = req.params;
  const allowed = [
    'name',
    'role',
    'status',
    'email',
    'password',
    'phone',
    'companyName',
    'businessName',
    'businessWebsite',
    'industry',
    'jobTitle',
    'timezone',
    'preferredContactMethod',
    'bio',
    'specialties',
    'technologies',
    'availability',
    'projectContactPreference',
    'notificationPreferences',
    'avatarUrl',
    'avatarPath',
  ];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

  const user = await User.findById(userId).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (hasForbiddenField(req.body, ADMIN_ONLY_FIELDS)) {
    return res.status(403).json({ message: 'Protected account fields cannot be changed from the admin UI' });
  }

  if (patch.email) patch.email = normalizeEmail(patch.email);
  if (patch.role && !VALID_ROLES.includes(patch.role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (isProtectedAccount(user)) {
    const attemptsProtectedMutation = hasForbiddenField(patch, PROTECTED_MUTATION_FIELDS);
    if (attemptsProtectedMutation) {
      return res.status(403).json({ message: 'Protected super admin account cannot be demoted, disabled, deleted, or credential-modified here' });
    }
  }

  if (patch.status) patch.accountStatus = patch.status;
  Object.assign(user, patch);
  await user.save();

  const safe = await User.findById(userId).select('-password');
  res.json({ user: safe });
}

export async function deleteUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (isProtectedAccount(user)) {
    return res.status(403).json({ message: 'Protected super admin account cannot be deleted' });
  }
  await user.deleteOne();
  res.json({ ok: true });
}

export async function approveUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.status = 'active';
  user.accountStatus = 'active';
  await user.save();
  res.json({ user });
}

// Reject semantics: remove if still pending
export async function rejectUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (isProtectedAccount(user)) {
    return res.status(403).json({ message: 'Protected super admin account cannot be rejected' });
  }
  if (user.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending users can be rejected' });
  }
  await user.deleteOne();
  res.json({ ok: true });
}

export async function updateRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (isProtectedAccount(user)) {
    return res.status(403).json({ message: 'Protected super admin account cannot be demoted' });
  }
  user.role = role;
  await user.save();
  res.json({ user });
}
