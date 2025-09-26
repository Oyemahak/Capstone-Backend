// src/scripts/seedAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const {
  MONGO_URI,
  SEED_ADMIN_NAME = 'Admin User',
  SEED_ADMIN_EMAIL = 'admin@mspixel.pulse',
  SEED_ADMIN_PASSWORD = 'admin',
  ADMIN_FORCE_RESET = 'false',
} = process.env;

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI missing in .env');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  let user = await User.findOne({ email: SEED_ADMIN_EMAIL }).select('+password');

  if (!user) {
    user = await User.create({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD, // plain; model will hash
      role: 'admin',
      status: 'active',
    });
    console.log('✅ Admin created:', user.email);
  } else {
    let changed = false;
    if (user.role !== 'admin') { user.role = 'admin'; changed = true; }
    if (user.status !== 'active') { user.status = 'active'; changed = true; }
    if (SEED_ADMIN_NAME && user.name !== SEED_ADMIN_NAME) { user.name = SEED_ADMIN_NAME; changed = true; }
    if (String(ADMIN_FORCE_RESET).toLowerCase() === 'true') {
      user.password = SEED_ADMIN_PASSWORD; // plain; pre-save hashes
      changed = true;
      console.log('ℹ️ Password will be reset for:', user.email);
    }
    if (changed) { await user.save(); console.log('✅ Admin updated:', user.email); }
    else { console.log('ℹ️ Admin already up-to-date:', user.email); }
  }
}

main()
  .catch(err => { console.error('❌ Seed error:', err); })
  .finally(async () => { await mongoose.disconnect(); process.exit(0); });