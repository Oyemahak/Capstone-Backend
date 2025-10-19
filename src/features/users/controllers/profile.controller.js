// backend/src/features/users/controllers/profile.controller.js
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { supabase } from '../../../lib/supabase.js';
import User from '../../../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const BUCKET = process.env.SUPABASE_BUCKET || 'mspp-files';

// in-memory file buffer
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

function getToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}
export function requireAuth(req, res, next) {
  try {
    const t = getToken(req);
    if (!t) return res.status(401).json({ message: 'Unauthorized' });
    const p = jwt.verify(t, JWT_SECRET);
    req.userId = p.id;
    req.userRole = p.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// POST /api/users/me/avatar  (form-data: avatar)
export async function setMyAvatar(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Avatar file is required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const safeName = (file.originalname || 'avatar').replace(/[^\w.-]+/g, '_');
    const ts = Date.now();
    const storePath = `avatars/${user._id}/${ts}-${safeName}`;
    const contentType = file.mimetype || 'image/png';

    // upload to Supabase
    const { error: upErr } = await supabase
      .storage
      .from(BUCKET)
      .upload(storePath, file.buffer, { contentType, upsert: true });

    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return res.status(500).json({ message: 'Upload failed' });
    }

    // public URL
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storePath);
    const publicUrl = pub?.publicUrl || '';

    // Optionally remove old file if exists and different
    if (user.avatarPath && user.avatarPath !== storePath) {
      await supabase.storage.from(BUCKET).remove([user.avatarPath]).catch(() => {});
    }

    user.avatarUrl = publicUrl;
    user.avatarPath = storePath;
    await user.save();

    res.json({ ok: true, avatarUrl: publicUrl });
  } catch (e) {
    console.error('setMyAvatar error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/users/me/avatar
export async function deleteMyAvatar(_req, res) {
  try {
    const user = await User.findById(_req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // remove from storage if present
    if (user.avatarPath) {
      await supabase.storage.from(BUCKET).remove([user.avatarPath]).catch(() => {});
    }

    user.avatarUrl = '';
    user.avatarPath = '';
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('deleteMyAvatar error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}