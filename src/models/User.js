// backend/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: true },
    role: { type: String, enum: ['admin', 'developer', 'client'], default: 'client' },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },

    // NEW: avatar fields
    avatarUrl: { type: String, trim: true, default: '' },  // public URL for header
    avatarPath: { type: String, trim: true, default: '' }, // storage path for clean deletes
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', UserSchema);