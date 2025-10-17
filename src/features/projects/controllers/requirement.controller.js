// backend/src/features/projects/controllers/requirement.controller.js
import multer from "multer";
import Requirement from "../../../models/Requirement.js";
import Project from "../../../models/Project.js";
import { uploadBuffer } from "../../../lib/supabase.js";

/**
 * Multer keeps files in memory so we can stream to Supabase.
 */
export const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB/file
});

/**
 * GET /api/projects/:projectId/requirements
 */
export async function getRequirement(req, res) {
  const { projectId } = req.params;
  const doc = await Requirement.findOne({ project: projectId }).lean();
  res.json({ ok: true, requirement: doc || null });
}

/**
 * PUT /api/projects/:projectId/requirements
 *
 * Roles: admin, developer, client (router enforces).
 *
 * ADDITIVE UPSERT RULES:
 *  - Pages merge by name (case-insensitive). Files append; note only overwrites if provided.
 *  - Uploading logo/brief replaces only that field (not other fields).
 *  - Supporting docs append.
 *  - Absent fields are left untouched (no destructive wipe).
 *
 * Form-data:
 *  - logo (file)
 *  - brief (file)
 *  - supporting (files, multiple)
 *  - pages: JSON string: [{ name, note }]
 *  - pageFiles[Home][] (files...), pageFiles[Services][], etc.
 */
export async function upsertRequirement(req, res) {
  const { projectId } = req.params;
  const me = req.user;
  const now = Date.now();

  const clean = (s) => String(s || "").replace(/[^\w.\- ]+/g, "_");
  const norm = (s) => String(s || "").trim();
  const keyOf = (s) => norm(s).toLowerCase();

  async function put(one, keyPath) {
    if (!one) return null;
    const original = one.originalname || "file";
    const path = `projects/${projectId}/${keyPath}/${now}_${clean(original)}`;
    const { url } = await uploadBuffer(path, one.buffer, one.mimetype || "application/octet-stream");
    return { name: original, type: one.mimetype, size: one.size, path, url };
  }

  // Parse incoming pages meta
  let pagesMeta = [];
  try { pagesMeta = JSON.parse(String(req.body.pages || "[]")); } catch { pagesMeta = []; }

  // Load current doc or create new
  const current =
    (await Requirement.findOne({ project: projectId })) ||
    new Requirement({ project: projectId });

  const next = current.toObject();

  // Core uploads (replace field only)
  if (req.files?.logo?.[0]) next.logo  = await put(req.files.logo[0], "core/logo");
  if (req.files?.brief?.[0]) next.brief = await put(req.files.brief[0], "core/brief");

  // Supporting docs (append)
  if (Array.isArray(req.files?.supporting) && req.files.supporting.length) {
    const uploaded = [];
    for (const f of req.files.supporting) uploaded.push(await put(f, "supporting"));
    next.supporting = Array.isArray(next.supporting) ? [...next.supporting, ...uploaded] : uploaded;
  }

  // Per-page uploads keyed by field name pageFiles[<Name>]
  const perPageUploads = {};
  for (const field of Object.keys(req.files || {})) {
    const m = field.match(/^pageFiles\[(.+)\]$/);
    if (!m) continue;
    const pageName = m[1];
    for (const f of req.files[field]) {
      const ref = await put(f, `pages/${encodeURIComponent(pageName)}`);
      if (!perPageUploads[pageName]) perPageUploads[pageName] = [];
      perPageUploads[pageName].push(ref);
    }
  }

  // Build existing map (case-insensitive key)
  const map = new Map();
  for (const p of Array.isArray(next.pages) ? next.pages : []) {
    map.set(keyOf(p.name), { ...p, name: norm(p.name) });
  }

  // Merge meta + uploads into existing pages
  for (const meta of pagesMeta) {
    const name = norm(meta?.name || "");
    if (!name) continue;
    const k = keyOf(name);
    const newFiles = perPageUploads[name] || [];

    if (map.has(k)) {
      const cur = map.get(k);
      map.set(k, {
        name,
        note: meta.note !== undefined ? String(meta.note || "") : cur.note,
        files: [...(cur.files || []), ...newFiles],
      });
    } else {
      map.set(k, {
        name,
        note: String(meta.note || ""),
        files: newFiles,
      });
    }
  }

  // Handle uploads that came without a meta entry
  for (const name of Object.keys(perPageUploads)) {
    const k = keyOf(name);
    if (!map.has(k)) {
      map.set(k, { name: norm(name), note: "", files: perPageUploads[name] });
    }
  }

  next.pages = Array.from(map.values());

  // Persist requirements
  current.set(next);
  const saved = await current.save();

  // If the updater is the client, auto-log a brief announcement so Admin/Dev see it
  if (me?.role === 'client') {
    const project = await Project.findById(projectId);
    if (project) {
      const short = `Client updated requirements (${new Date().toLocaleString()})`;
      project.announcements.unshift({
        title: short,
        body: 'New/updated files or notes were added by the client.',
        ts: Date.now(),
        author: me._id,
      });
      await project.save();
    }
  }

  res.json({ ok: true, requirement: saved.toObject() });
}

/**
 * PATCH /api/projects/:projectId/requirements/review
 * Roles: admin or developer
 */
export async function setReview(req, res) {
  const { projectId } = req.params;
  const { reviewed = true } = req.body || {};
  const doc = await Requirement.findOneAndUpdate(
    { project: projectId },
    { $set: { reviewedByDev: !!reviewed, reviewedAt: reviewed ? new Date() : null } },
    { new: true, upsert: true }
  ).lean();
  res.json({ ok: true, requirement: doc });
}

/**
 * DELETE /api/projects/:projectId/requirements
 * Role: admin — removes the whole requirements doc (does not purge storage).
 */
export async function deleteRequirement(req, res) {
  const { projectId } = req.params;
  await Requirement.findOneAndDelete({ project: projectId });
  res.json({ ok: true });
}