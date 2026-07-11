// backend/src/features/users/controllers/profile.controller.js
import multer from 'multer';
import path from 'path';
import { ensureStorageReady, SUPA_BUCKET } from '../../../lib/supabase.js';
import User from '../../../models/User.js';

// in-memory file buffer
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// POST /api/users/me/avatar  (form-data: avatar)
export async function setMyAvatar(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Avatar file is required' });

    const client = ensureStorageReady();
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const safeName = (file.originalname || 'avatar').replace(/[^\w.-]+/g, '_');
    const ts = Date.now();
    const storePath = `avatars/${user._id}/${ts}-${safeName}`;
    const contentType = file.mimetype || 'image/png';

    // upload to Supabase
    const { error: upErr } = await client
      .storage
      .from(SUPA_BUCKET)
      .upload(storePath, file.buffer, { contentType, upsert: true });

    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return res.status(500).json({ message: 'Upload failed' });
    }

    // public URL
    const { data: pub } = client.storage.from(SUPA_BUCKET).getPublicUrl(storePath);
    const publicUrl = pub?.publicUrl || '';

    // Optionally remove old file if exists and different
    if (user.avatarPath && user.avatarPath !== storePath) {
      await client.storage.from(SUPA_BUCKET).remove([user.avatarPath]).catch(() => {});
    }

    user.avatarUrl = publicUrl;
    user.avatarPath = storePath;
    await user.save();

    res.json({ ok: true, avatarUrl: publicUrl });
  } catch (e) {
    console.error('setMyAvatar error:', e.code || e.message);
    res.status(e.status || 500).json({ message: e.status === 503 ? 'File storage is unavailable' : 'Server error' });
  }
}

// DELETE /api/users/me/avatar
export async function deleteMyAvatar(_req, res) {
  try {
    const client = ensureStorageReady();
    const user = await User.findById(_req.user?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // remove from storage if present
    if (user.avatarPath) {
      await client.storage.from(SUPA_BUCKET).remove([user.avatarPath]).catch(() => {});
    }

    user.avatarUrl = '';
    user.avatarPath = '';
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('deleteMyAvatar error:', e.code || e.message);
    res.status(e.status || 500).json({ message: e.status === 503 ? 'File storage is unavailable' : 'Server error' });
  }
}
