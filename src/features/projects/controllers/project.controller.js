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
 * Admin: may patch title, summary, status, client, developer, evidence
 * Developer: may patch ONLY evidence on projects where they are the assigned developer
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
  const adminAllowed = ['title', 'summary', 'status', 'client', 'developer', 'evidence'];
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