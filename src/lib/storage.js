// backend/src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPA_BUCKET = process.env.SUPABASE_BUCKET || "uploads";
export const supabaseConfigured = Boolean(url && key);

if (!supabaseConfigured) {
  console.warn("Supabase storage is not configured; storage helper calls will return 503.");
}

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function ensureStorageReady() {
  if (!supabase || !SUPA_BUCKET) {
    const err = new Error("File storage is unavailable");
    err.status = 503;
    err.code = "STORAGE_UNAVAILABLE";
    throw err;
  }
  return supabase;
}

/**
 * Upload a Buffer to Supabase Storage at path.
 * Returns { path, url } (public URL if bucket is public, else signed URL).
 */
export async function uploadBuffer(path, buffer, contentType = "application/octet-stream") {
  const client = ensureStorageReady();
  const { error } = await client.storage.from(SUPA_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  // Try to get a signed URL (works for private); if bucket is public, getPublicUrl works too
  // Prefer signed URL valid for 7 days
  const { data: signed, error: signErr } = await client
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (!signErr && signed?.signedUrl) return { path, url: signed.signedUrl };

  const { data: pub } = client.storage.from(SUPA_BUCKET).getPublicUrl(path);
  return { path, url: pub?.publicUrl || "" };
}

export async function putObject({ path, buffer, contentType = "application/octet-stream" }) {
  return uploadBuffer(path, buffer, contentType);
}

export async function signedURL(path, expiresInSeconds = 60 * 60 * 24 * 7) {
  const client = ensureStorageReady();
  const { data, error } = await client
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data?.signedUrl || "";
}

export async function removeObject(path) {
  const client = ensureStorageReady();
  const { error } = await client.storage.from(SUPA_BUCKET).remove([path]);
  if (error) throw error;
}
