import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const FIXTURES = [
  { name: 'Admin', email: 'admin@mspixel.pulse', password: 'admin', role: 'admin', status: 'active' },
  { name: 'Client', email: 'client@mspixel.pulse', password: 'client', role: 'client', status: 'active' },
  { name: 'Developer', email: 'dev@mspixel.pulse', password: 'developer', role: 'developer', status: 'active' },
];

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  for (const fixture of FIXTURES) {
    const email = fixture.email.toLowerCase();
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      user = await User.create({ ...fixture, email });
      results.push({ email, action: 'created' });
      continue;
    }

    user.name = fixture.name;
    user.role = fixture.role;
    user.status = fixture.status;
    user.password = fixture.password;
    await user.save();
    results.push({ email, action: 'updated' });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main()
  .catch((err) => {
    console.error('Seed demo failed:', err.code || err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
