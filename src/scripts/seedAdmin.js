// src/scripts/seedAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const {
  MONGO_URI,
  SEED_ADMIN_NAME = 'Admin User',
  SEED_ADMIN_EMAIL = 'admin@example.com',
  SEED_ADMIN_PASSWORD = 'ChangeMe123!',
  // set ADMIN_FORCE_RESET=true in env if you want to reset the password when the user already exists
  ADMIN_FORCE_RESET = 'false',
} = process.env;

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI missing in .env');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // find admin by email
  let user = await User.findOne({ email: SEED_ADMIN_EMAIL });

  if (!user) {
    // CREATE new admin — IMPORTANT: pass the PLAIN password
    // Your User model’s pre-save hook will hash it.
    user = await User.create({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD, // <- plain text; model hashes
      role: 'admin',
      status: 'active',
    });
    console.log('✅ Admin created:', user.email);
  } else {
    // UPDATE existing admin (don’t bypass hooks)
    let changed = false;

    if (user.role !== 'admin') {
      user.role = 'admin';
      changed = true;
    }
    if (user.status !== 'active') {
      user.status = 'active';
      changed = true;
    }
    if (SEED_ADMIN_NAME && user.name !== SEED_ADMIN_NAME) {
      user.name = SEED_ADMIN_NAME;
      changed = true;
    }
    // reset password only if explicitly requested
    if (String(ADMIN_FORCE_RESET).toLowerCase() === 'true') {
      user.password = SEED_ADMIN_PASSWORD; // plain text; pre-save will hash
      changed = true;
      console.log('ℹ️ Password will be reset for:', user.email);
    }

    if (changed) {
      await user.save(); // triggers pre-save hashing if password changed
      console.log('✅ Admin updated:', user.email);
    } else {
      console.log('ℹ️ Admin already up-to-date:', user.email);
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });