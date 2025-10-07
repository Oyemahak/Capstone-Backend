// backend/src/features/projects/controllers/requirement.controller.js
import multer from "multer";
import Requirement from "../../../models/Requirement.js";
import { uploadBuffer } from "../../../lib/supabase.js";

export const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export async function getRequirement(req, res) {
  const { projectId } = req.params;
  const doc = await Requirement.findOne({ project: projectId }).lean();
  return res.json({ ok: true, requirement: doc || null });
}

export async function upsertRequirement(req, res) {
  const { projectId } = req.params;
  const me = req.user;
  const now = Date.now();

  let pagesMeta = [];
  try { pagesMeta = JSON.parse(String(req.body.pages || "[]")); } catch { pagesMeta = []; }

  async function maybeUpload(one, keyPath) {
    if (!one) return null;
    const safeName = (one.originalname || `file_${now}`).replace(/[^\w.\-]/g, "_");
    const storePath = `projects/${projectId}/${keyPath}/${now}_${safeName}`;
    const { url, path } = await uploadBuffer(storePath, one.buffer, one.mimetype || "application/octet-stream");
    return { name: one.originalname, type: one.mimetype, size: one.size, path, url };
  }

  const logoRef = req.files?.logo?.[0] ? await maybeUpload(req.files.logo[0], "core/logo") : null;
  const briefRef = req.files?.brief?.[0] ? await maybeUpload(req.files.brief[0], "core/brief") : null;

  const supportingRefs = [];
  for (const f of req.files?.supporting || []) {
    supportingRefs.push(await maybeUpload(f, "supporting"));
  }

  const perPage = {};
  for (const key of Object.keys(req.files || {})) {
    const m = key.match(/^pageFiles\[(.+)\]$/);
    if (!m) continue;
    const pageName = m[1];
    perPage[pageName] = perPage[pageName] || [];
    for (const f of req.files[key]) {
      perPage[pageName].push(await maybeUpload(f, `pages/${encodeURIComponent(pageName)}`));
    }
  }

  const pages = (pagesMeta || []).map(p => ({
    name: p.name,
    note: p.note || "",
    files: (perPage[p.name] || []),
  }));

  const update = {
    client: me?._id,
    ...(logoRef ? { logo: logoRef } : {}),
    ...(briefRef ? { brief: briefRef } : {}),
    ...(supportingRefs.length ? { supporting: supportingRefs } : {}),
    ...(pages.length ? { pages } : {}),
  };

  const doc = await Requirement.findOneAndUpdate(
    { project: projectId },
    { $set: update, $setOnInsert: { project: projectId } },
    { new: true, upsert: true }
  ).lean();

  return res.json({ ok: true, requirement: doc });
}

export async function setReview(req, res) {
  const { projectId } = req.params;
  const { reviewed = true } = req.body || {};
  const doc = await Requirement.findOneAndUpdate(
    { project: projectId },
    { $set: { reviewedByDev: !!reviewed, reviewedAt: reviewed ? new Date() : null } },
    { new: true }
  ).lean();
  return res.json({ ok: true, requirement: doc });
}