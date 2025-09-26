// src/features/debug/controllers/debug.controller.js
import User from '../../../models/User.js';

const FIXTURES = [
  { name: 'Admin',     email: 'admin@mspixel.pulse',  password: 'admin',     role: 'admin',     status: 'active' },
  { name: 'Client',    email: 'client@mspixel.pulse', password: 'client',    role: 'client',    status: 'active' },
  { name: 'Developer', email: 'dev@mspixel.pulse',    password: 'developer', role: 'developer', status: 'active' },
];

/** Create if missing (plain password; pre-save will hash) */
export async function seedBasic(_req, res) {
  const results = [];
  for (const u of FIXTURES) {
    const exists = await User.findOne({ email: u.email });
    if (exists) { results.push({ email: u.email, created: false }); continue; }
    const user = await User.create({ name: u.name, email: u.email, password: u.password, role: u.role, status: u.status });
    results.push({ email: user.email, created: true });
  }
  res.json({ message: 'Seeded basic users', results });
}

/** Force reset passwords/role/status to the defaults (plain → hashed by hook) */
export async function resetBasic(_req, res) {
  const results = [];
  for (const u of FIXTURES) {
    let user = await User.findOne({ email: u.email }).select('+password');
    if (!user) {
      user = await User.create({ name: u.name, email: u.email, password: u.password, role: u.role, status: u.status });
      results.push({ email: u.email, action: 'created' });
      continue;
    }
    user.name = u.name;
    user.role = u.role;
    user.status = u.status;
    user.password = u.password;          // plain; pre-save will hash
    await user.save();                   // triggers pre-save
    results.push({ email: u.email, action: 'reset' });
  }
  res.json({ message: 'Reset basic users', results });
}