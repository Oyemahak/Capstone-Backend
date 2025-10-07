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

export async function uploadBuffer(path, buffer, contentType = "application/octet-stream") {
  const { error } = await supabase.storage.from(SUPA_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  // Prefer a 7-day signed URL (works for private buckets)
  const { data: signed, error: signErr } = await supabase
    .storage
    .from(SUPA_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (!signErr && signed?.signedUrl) return { path, url: signed.signedUrl };

  // Fallback to public url if bucket is public
  const { data: pub } = supabase.storage.from(SUPA_BUCKET).getPublicUrl(path);
  return { path, url: pub?.publicUrl || "" };
}