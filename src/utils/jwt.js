// src/utils/jwt.js – choose ONE shape and stick to it
import jwt from 'jsonwebtoken';

export function signToken(user) {
  // Use id (to match your original controller)
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}