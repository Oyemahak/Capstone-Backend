import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const {
  MONGO_URI,
  SEED_ADMIN_NAME = 'Admin User',
  SEED_ADMIN_EMAIL = 'admin@example.com',
  SEED_ADMIN_PASSWORD = 'ChangeMe123!'
} = process.env;

(async function run() {
  try {
    if (!MONGO_URI) throw new Error('MONGO_URI missing in .env');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let user = await User.findOne({ email: SEED_ADMIN_EMAIL });
    if (user) {
      console.log('ℹ️ Admin already exists:', SEED_ADMIN_EMAIL);
    } else {
      const hashed = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
      user = await User.create({
        name: SEED_ADMIN_NAME,
        email: SEED_ADMIN_EMAIL,
        password: hashed,
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Admin created:', user.email);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();