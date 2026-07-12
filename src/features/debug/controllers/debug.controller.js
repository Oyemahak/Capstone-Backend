// src/features/debug/controllers/debug.controller.js
import User from '../../../models/User.js';

const FIXTURES = [
  { name: 'Admin',     email: process.env.SEED_DEMO_ADMIN_EMAIL || 'admin@mspixelpulse.local',  passwordEnv: 'SEED_DEMO_ADMIN_PASSWORD',     role: 'admin',     status: 'active' },
  { name: 'Client',    email: process.env.SEED_DEMO_CLIENT_EMAIL || 'client@mspixelpulse.local', passwordEnv: 'SEED_DEMO_CLIENT_PASSWORD',    role: 'client',    status: 'active' },
  { name: 'Developer', email: process.env.SEED_DEMO_DEVELOPER_EMAIL || 'dev@mspixelpulse.local', passwordEnv: 'SEED_DEMO_DEVELOPER_PASSWORD', role: 'developer', status: 'active' },
];

function passwordFor(fixture) {
  const password = process.env[fixture.passwordEnv]?.trim();
  if (!password) throw new Error(`${fixture.passwordEnv} is required`);
  return password;
}

/** Create if missing (plain password comes from env; pre-save will hash) */
export async function seedBasic(_req, res) {
  const results = [];
  for (const u of FIXTURES) {
    const password = passwordFor(u);
    const exists = await User.findOne({ email: u.email });
    if (exists) { results.push({ email: u.email, created: false }); continue; }
    const user = await User.create({ name: u.name, email: u.email, password, role: u.role, status: u.status, accountStatus: u.status });
    results.push({ email: user.email, created: true });
  }
  res.json({ message: 'Seeded basic users', results });
}

/** Force reset passwords/role/status to the env values (plain -> hashed by hook) */
export async function resetBasic(_req, res) {
  const results = [];
  for (const u of FIXTURES) {
    const password = passwordFor(u);
    let user = await User.findOne({ email: u.email }).select('+password');
    if (!user) {
      user = await User.create({ name: u.name, email: u.email, password, role: u.role, status: u.status, accountStatus: u.status });
      results.push({ email: u.email, action: 'created' });
      continue;
    }
    user.name = u.name;
    user.role = u.role;
    user.status = u.status;
    user.accountStatus = u.status;
    user.password = password;            // plain; pre-save will hash
    await user.save();                   // triggers pre-save
    results.push({ email: u.email, action: 'reset' });
  }
  res.json({ message: 'Reset basic users', results });
}
