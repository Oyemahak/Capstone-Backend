// backend/src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client (server-side, service role)
 * Make sure these are set in your environment:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - SUPABASE_BUCKET (optional; defaults to "mspp-files")
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("⚠️ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing – uploads will fail.");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const SUPA_BUCKET = process.env.SUPABASE_BUCKET || "mspp-files";

/**
 * Upload a Node.js Buffer to Supabase Storage.
 * Returns: { path, url } with a 7-day signed URL when possible,
 *          otherwise falls back to public URL (when bucket is public).
 *
 * @param {string} path        Storage path, e.g. "avatars/<userId>/<fileName>"
 * @param {Buffer} buffer      Raw file buffer
 * @param {string} contentType Mime type (default: application/octet-stream)
 */
export async function uploadBuffer(path, buffer, contentType = "application/octet-stream") {
  const { error } = await supabase
    .storage
    .from(SUPA_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  // Prefer a 7-day signed URL (works for private buckets too)
  const { data: signed, error: signErr } = await supabase
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (!signErr && signed?.signedUrl) {
    return { path, url: signed.signedUrl };
  }

  // Fallback to public URL (if bucket is public)
  const { data: pub } = supabase.storage.from(SUPA_BUCKET).getPublicUrl(path);
  return { path, url: pub?.publicUrl || "" };
}

/**
 * Create a signed URL for an existing object (default 7 days).
 * Useful when you stored only the path and need a fresh link later.
 */
export async function createSignedUrl(path, expiresInSeconds = 60 * 60 * 24 * 7) {
  const { data, error } = await supabase
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data?.signedUrl || "";
}

/**
 * Get a public URL (only works if bucket/object is public).
 */
export function getPublicUrl(path) {
  const { data } = supabase.storage.from(SUPA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

/**
 * Remove a single object by path. Ignores missing files.
 */
export async function removePath(path) {
  if (!path) return;
  await supabase.storage.from(SUPA_BUCKET).remove([path]).catch(() => {});
}