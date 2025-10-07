// server/routes/billing.js
import express from "express";
import multer from "multer";
import Project from "../models/Project.js";
import { supabase, publicUrl } from "../lib/supabase.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const BUCKET = "billing";
const r = express.Router();

/* Helpers */
const sanitize = (s="") => s.replace(/[^\w.\-]+/g, "_");
const mkPath = (projectId, kind, orig) => `billing/${projectId}/${kind}-${Date.now()}-${sanitize(orig||"file")}`;

async function putToStorage(path, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return publicUrl(BUCKET, path);
}

/* ───────────────────────────────────────────────────────────
   GET (Admin)  /api/admin/projects/:projectId/billing
   GET (Client) /api/projects/:projectId/billing
   Returns: { billing: { advance, final, updatedAt } | null }
   ─────────────────────────────────────────────────────────── */
async function getBilling(req, res) {
  const { projectId } = req.params;
  const proj = await Project.findById(projectId);
  if (!proj) return res.status(404).json({ message: "Project not found" });
  return res.json({ billing: proj.billing || null });
}

/* ───────────────────────────────────────────────────────────
   PUT (Admin) /api/admin/projects/:projectId/billing
   multipart/form-data with fields: advance?, final?
   Uploads files, merges into project.billing
   ─────────────────────────────────────────────────────────── */
const putBilling = [
  upload.fields([{ name: "advance" }, { name: "final" }]),
  async (req, res) => {
    const { projectId } = req.params;
    const proj = await Project.findById(projectId);
    if (!proj) return res.status(404).json({ message: "Project not found" });

    const incoming = {};
    for (const kind of ["advance", "final"]) {
      const f = req.files?.[kind]?.[0];
      if (!f) continue;

      const storagePath = mkPath(projectId, kind, f.originalname);
      const url = await putToStorage(storagePath, f.buffer, f.mimetype);

      incoming[kind] = {
        name: f.originalname,
        type: f.mimetype,
        url,
        path: storagePath,
        status: "unpaid",
        uploadedAt: new Date(),
      };
    }

    if (!proj.billing) proj.billing = { advance: null, final: null, updatedAt: new Date() };
    proj.billing = { ...proj.billing, ...incoming, updatedAt: new Date() };
    await proj.save();

    return res.json({ billing: proj.billing });
  },
];

/* ───────────────────────────────────────────────────────────
   PATCH (Admin) /api/admin/projects/:projectId/billing
   body: { kind: 'advance'|'final', status: 'unpaid'|'paid' }
   ─────────────────────────────────────────────────────────── */
async function patchBilling(req, res) {
  const { projectId } = req.params;
  const { kind, status } = req.body || {};
  if (!["advance", "final"].includes(kind)) return res.status(400).json({ message: "Invalid kind" });
  if (!["unpaid", "paid"].includes(status)) return res.status(400).json({ message: "Invalid status" });

  const proj = await Project.findById(projectId);
  if (!proj) return res.status(404).json({ message: "Project not found" });
  if (!proj.billing || !proj.billing[kind]) return res.status(404).json({ message: "Invoice not found" });

  proj.billing[kind].status = status;
  proj.billing.updatedAt = new Date();
  await proj.save();

  return res.json({ billing: proj.billing });
}

/* ───────────────────────────────────────────────────────────
   DELETE (Admin) /api/admin/projects/:projectId/billing?kind=advance|final
   If kind omitted, removes both
   ─────────────────────────────────────────────────────────── */
async function deleteBilling(req, res) {
  const { projectId } = req.params;
  const { kind } = req.query; // optional

  const proj = await Project.findById(projectId);
  if (!proj) return res.status(404).json({ message: "Project not found" });
  if (!proj.billing) return res.json({ billing: null });

  const paths = [];
  if (kind) {
    const meta = proj.billing[kind];
    if (meta?.path) paths.push(meta.path);
    proj.billing[kind] = null;
  } else {
    for (const k of ["advance", "final"]) {
      const meta = proj.billing[k];
      if (meta?.path) paths.push(meta.path);
      proj.billing[k] = null;
    }
  }

  if (paths.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) return res.status(500).json({ message: error.message });
  }

  // if both removed, clear billing object
  if (!proj.billing.advance && !proj.billing.final) {
    proj.billing = null;
  } else {
    proj.billing.updatedAt = new Date();
  }

  await proj.save();
  return res.json({ billing: proj.billing });
}

/* Mount handlers */
r.get   ("/admin/projects/:projectId/billing", getBilling);   // admin view
r.put   ("/admin/projects/:projectId/billing", ...putBilling);
r.patch ("/admin/projects/:projectId/billing", patchBilling);
r.delete("/admin/projects/:projectId/billing", deleteBilling);

// client view
r.get("/projects/:projectId/billing", getBilling);

export default r;