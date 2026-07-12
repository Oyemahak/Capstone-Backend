import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function run() {
  const email = required('SUPER_ADMIN_EMAIL').toLowerCase();
  const password = required('SUPER_ADMIN_PASSWORD');
  const name = required('SUPER_ADMIN_NAME');
  const shouldResetPassword = process.env.SUPER_ADMIN_FORCE_PASSWORD_RESET === 'true';

  await connectDB();

  const existing = await User.findOne({ email }).select('+password');
  if (!existing) {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'active',
      accountStatus: 'active',
      isSuperAdmin: true,
      isProtected: true,
      protectedReason: 'Primary MSPixelPulse super admin account',
      jobTitle: 'Founder / Super Admin',
      timezone: 'America/Toronto',
      preferredContactMethod: 'portal',
      bio: 'Primary MSPixelPulse account for protected production administration.',
      specialties: ['Agency operations', 'Client portals', 'Website delivery'],
      technologies: ['React', 'Node.js', 'MongoDB', 'Supabase'],
    });
    console.log(JSON.stringify({ ok: true, action: 'created', email, passwordReset: true }, null, 2));
    return;
  }

  existing.name = name;
  existing.role = 'admin';
  existing.status = 'active';
  existing.accountStatus = 'active';
  existing.isSuperAdmin = true;
  existing.isProtected = true;
  existing.protectedReason = 'Primary MSPixelPulse super admin account';
  existing.jobTitle = existing.jobTitle || 'Founder / Super Admin';
  existing.timezone = existing.timezone || 'America/Toronto';
  existing.preferredContactMethod = existing.preferredContactMethod || 'portal';
  existing.bio = existing.bio || 'Primary MSPixelPulse account for protected production administration.';
  existing.specialties = existing.specialties?.length
    ? existing.specialties
    : ['Agency operations', 'Client portals', 'Website delivery'];
  existing.technologies = existing.technologies?.length
    ? existing.technologies
    : ['React', 'Node.js', 'MongoDB', 'Supabase'];

  if (shouldResetPassword) existing.password = password;
  await existing.save();

  console.log(JSON.stringify({ ok: true, action: 'updated', email, passwordReset: shouldResetPassword }, null, 2));
}

run()
  .catch((error) => {
    console.error(error.message || 'Super admin seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
