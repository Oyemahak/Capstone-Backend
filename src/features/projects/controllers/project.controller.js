// backend/src/features/projects/controllers/project.controller.js
import Project from '../../../models/Project.js';

/* Populate user refs consistently */
const POP = [
  { path: 'client', select: 'name email role status' },
  { path: 'developer', select: 'name email role status' },
];

/** GET /api/projects?status=&q= */
export async function listProjects(req, res) {
  const { q = '', status } = req.query;

  const cond = {};
  if (status) cond.status = status;
  if (q) {
    const rx = { $regex: q, $options: 'i' };
    cond.$or = [{ title: rx }, { summary: rx }];
  }

  const projects = await Project.find(cond).sort({ createdAt: -1 }).populate(POP);
  res.json({ projects });
}

/** GET /api/projects/:projectId */
export async function getProject(req, res) {
  const { projectId } = req.params;
  const project = await Project.findById(projectId).populate(POP);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ project });
}

/** POST /api/projects  (admin) */
export async function createProject(req, res) {
  const { title, summary = '', status = 'draft', client = null, developer = null } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

  const created = await Project.create({
    title: title.trim(),
    summary: summary.trim?.() || '',
    status,
    client: client || null,
    developer: developer || null,
  });

  const project = await Project.findById(created._id).populate(POP);
  res.status(201).json({ project });
}

/**
 * PATCH /api/projects/:projectId
 *
 * Admin: may patch title, summary, status, client, developer, evidence, announcements
 * Developer: may patch ONLY evidence (not announcements – use POST endpoints)
 */
export async function updateProject(req, res) {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const isAdmin = req.user?.role === 'admin';
  const isAssignedDev =
    req.user?.role === 'developer' && String(project.developer) === String(req.user._id);

  if (!isAdmin && !isAssignedDev) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Build patch based on role
  const adminAllowed = ['title', 'summary', 'status', 'client', 'developer', 'evidence', 'announcements'];
  const devAllowed   = ['evidence'];

  const allowedKeys = isAdmin ? adminAllowed : devAllowed;
  const patch = {};
  for (const k of allowedKeys) {
    if (k in req.body) patch[k] = req.body[k];
  }

  // If developer is attempting to change anything other than evidence, block
  if (!isAdmin) {
    const keys = Object.keys(req.body || {});
    const illegal = keys.filter((k) => !devAllowed.includes(k));
    if (illegal.length) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  const updated = await Project.findByIdAndUpdate(projectId, patch, {
    new: true,
    runValidators: true,
  }).populate(POP);

  res.json({ project: updated });
}

/** DELETE /api/projects/:projectId (admin) */
export async function deleteProject(req, res) {
  const { projectId } = req.params;
  const doc = await Project.findByIdAndDelete(projectId);
  if (!doc) return res.status(404).json({ message: 'Project not found' });
  res.json({ ok: true });
}

export const removeProject = deleteProject;

// ─────────────────────────────────────────────────────────────
// Evidence – explicit endpoint to add one entry (Admin/Dev)
// POST /api/projects/:projectId/evidence  body: { title, links[], images[] }
// ─────────────────────────────────────────────────────────────
export async function addEvidence(req, res) {
  const { projectId } = req.params;
  const me = req.user;

  if (!['admin', 'developer'].includes(me.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { title = 'Update', links = [], images = [] } = req.body || {};
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  project.evidence.unshift({
    title: String(title || 'Update'),
    links: Array.isArray(links) ? links : [],
    images: Array.isArray(images) ? images : [],
    ts: Date.now(),
    author: me._id,
  });

  await project.save();
  const populated = await Project.findById(projectId).populate(POP);
  res.status(201).json({ ok: true, project: populated });
}

// ─────────────────────────────────────────────────────────────
// Announcements – visible to all; create by Admin/Dev
// ─────────────────────────────────────────────────────────────
/** GET /api/projects/:projectId/announcements */
export async function listAnnouncements(req, res) {
  const { projectId } = req.params;
  const project = await Project.findById(projectId).select('announcements').lean();
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const items = [...(project.announcements || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  res.json({ ok: true, items });
}

/** POST /api/projects/:projectId/announcements  (admin/dev) */
export async function createAnnouncement(req, res) {
  const { projectId } = req.params;
  const me = req.user;

  if (!['admin', 'developer'].includes(me.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { title = '', body = '' } = req.body || {};
  if (!title.trim()) return res.status(400).json({ message: 'Title is required' });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const entry = { title: title.trim(), body: String(body || ''), ts: Date.now(), author: me._id };
  project.announcements.unshift(entry);
  await project.save();

  const populated = await Project.findById(projectId).populate(POP);
  res.status(201).json({ ok: true, announcement: entry, project: populated });
}

/** DELETE /api/projects/:projectId/announcements/:idx  (admin) */
export async function deleteAnnouncement(req, res) {
  const { projectId, idx } = req.params;
  const me = req.user;

  if (me.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const i = Number(idx);
  if (!Number.isInteger(i) || i < 0 || i >= project.announcements.length) {
    return res.status(400).json({ message: 'Invalid index' });
  }
  project.announcements.splice(i, 1);
  await project.save();

  const populated = await Project.findById(projectId).populate(POP);
  res.json({ ok: true, project: populated });
}