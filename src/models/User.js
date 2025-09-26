// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: true },
    role: { type: String, enum: ['admin', 'developer', 'client'], default: 'client' },
    status: { type: String, enum: ['pending', 'active', 'disabled'], default: 'pending' },
  },
  { timestamps: true }
);

// Hash on save if changed
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;