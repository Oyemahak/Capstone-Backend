import 'dotenv/config';
import { ensureStorageReady, SUPA_BUCKET } from '../lib/supabase.js';

const DEMO_PATH = /(^|\/)(test|demo|sample|dummy|tmp|temp)(\/|-|_)/i;

async function listRecursive(client, prefix = '') {
  const { data, error } = await client.storage.from(SUPA_BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;

  const objects = [];
  for (const item of data || []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata === null) {
      objects.push(...await listRecursive(client, fullPath));
    } else {
      objects.push({ path: fullPath, size: item.metadata?.size, updatedAt: item.updated_at });
    }
  }
  return objects;
}

async function main() {
  const client = ensureStorageReady();
  const objects = await listRecursive(client);
  const candidates = objects
    .filter((item) => DEMO_PATH.test(item.path))
    .map((item) => ({ ...item, reason: 'path contains test/demo/sample/dummy/tmp marker' }));

  console.log(JSON.stringify({
    mode: 'dry-run',
    bucket: SUPA_BUCKET,
    totalObjects: objects.length,
    candidateCount: candidates.length,
    candidates,
  }, null, 2));
}

main().catch((err) => {
  console.error('Storage cleanup dry-run failed:', err.code || err.message);
  process.exitCode = 1;
});
