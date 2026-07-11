import 'dotenv/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';

const CONFIRM = process.argv.includes('--confirm');
const DEMO_EMAIL_DOMAINS = ['@mspixel.pulse', '@mspixel.plus', '@example.com'];
const DEMO_WORDS = /\b(test|demo|sample|dummy|john doe|jane doe)\b/i;
const PRESERVE_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const SAFE_DELETE_COLLECTIONS = new Set(['leads']);

function reasonForDoc(collection, doc) {
  const reasons = [];
  const email = String(doc.email || '').toLowerCase();
  const name = String(doc.name || doc.title || doc.subject || '').trim();
  const text = [doc.summary, doc.message, doc.notes, doc.body].filter(Boolean).join(' ');

  if (email && DEMO_EMAIL_DOMAINS.some((domain) => email.endsWith(domain))) {
    reasons.push(`demo email ${email}`);
  }
  if (name && DEMO_WORDS.test(name)) reasons.push(`placeholder name/title "${name}"`);
  if (text && DEMO_WORDS.test(text)) reasons.push('placeholder content');
  if (doc.demo === true || doc.isDemo === true || doc.seeded === true) reasons.push('demo marker');

  if (collection === 'users' && email === PRESERVE_EMAIL) return [];
  return reasons;
}

function publicIdentifier(doc) {
  return {
    id: String(doc._id),
    email: doc.email || undefined,
    name: doc.name || undefined,
    title: doc.title || undefined,
    createdAt: doc.createdAt || undefined,
  };
}

async function backupMatches(matches) {
  const backupDir = path.join(os.tmpdir(), 'capstone-backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `dummy-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(backupPath, JSON.stringify(matches, null, 2));
  return backupPath;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);

  const collections = await mongoose.connection.db.collections();
  const report = [];
  const matches = {};

  for (const collection of collections) {
    const name = collection.collectionName;
    const docs = await collection.find({}).limit(1000).toArray();
    const matched = [];
    const ambiguous = [];

    for (const doc of docs) {
      const reasons = reasonForDoc(name, doc);
      if (reasons.length) matched.push({ ...publicIdentifier(doc), reasons });
      else if (DEMO_WORDS.test(JSON.stringify(publicIdentifier(doc)))) {
        ambiguous.push(publicIdentifier(doc));
      }
    }

    report.push({
      collection: name,
      scanned: docs.length,
      matched: matched.length,
      ambiguous: ambiguous.length,
      items: matched,
      ambiguousItems: ambiguous,
    });
    matches[name] = matched;
  }

  if (!CONFIRM) {
    console.log(JSON.stringify({ mode: 'dry-run', changed: false, report }, null, 2));
    return;
  }

  const backupPath = await backupMatches({ generatedAt: new Date().toISOString(), report });
  const deleted = [];

  for (const entry of report) {
    if (!entry.matched || !SAFE_DELETE_COLLECTIONS.has(entry.collection)) {
      deleted.push({
        collection: entry.collection,
        deletedCount: 0,
        skipped: entry.matched > 0 ? 'manual review required to avoid orphaned references' : undefined,
      });
      continue;
    }
    const ids = entry.items.map((item) => new mongoose.Types.ObjectId(item.id));
    const collection = mongoose.connection.db.collection(entry.collection);
    const result = await collection.deleteMany({ _id: { $in: ids } });
    deleted.push({ collection: entry.collection, deletedCount: result.deletedCount || 0 });
  }

  console.log(JSON.stringify({ mode: 'confirmed', backupPath, deleted, report }, null, 2));
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err.code || err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
