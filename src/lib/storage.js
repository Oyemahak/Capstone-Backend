// backend/src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

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
 * Upload a Buffer to Supabase Storage at path.
 * Returns { path, url } (public URL if bucket is public, else signed URL).
 */
export async function uploadBuffer(path, buffer, contentType = "application/octet-stream") {
  const { error } = await supabase.storage.from(SUPA_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  // Try to get a signed URL (works for private); if bucket is public, getPublicUrl works too
  // Prefer signed URL valid for 7 days
  const { data: signed, error: signErr } = await supabase
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (!signErr && signed?.signedUrl) return { path, url: signed.signedUrl };

  const { data: pub } = supabase.storage.from(SUPA_BUCKET).getPublicUrl(path);
  return { path, url: pub?.publicUrl || "" };
}