// src/features/projects/controllers/project.controller.js
import Project from '../../../models/Project.js';

function toView(p) {
  return {
    _id: p._id,
    title: p.name,
    summary: p.description,
    status: p.status === 'new' ? 'draft' : p.status === 'in-progress' ? 'active' : p.status,
    client: p.client || null,
    developer: Array.isArray(p.developers) ? (p.developers[0] || null) : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function fromView(body = {}) {
  const out = {};
  if ('title' in body) out.name = body.title;
  if ('summary' in body) out.description = body.summary;
  if ('status' in body) {
    out.status = body.status === 'draft' ? 'new'
      : body.status === 'active' ? 'in-progress'
      : body.status;
  }
  if ('client' in body) out.client = body.client || null;
  if ('developer' in body) out.developers = body.developer ? [body.developer] : [];
  return out;
}

export async function listProjects(req, res) {
  const where = {};
  if (req.user?.role === 'client') where.client = req.user._id;
  if (req.user?.role === 'developer') where.developers = req.user._id;

  const items = await Project.find(where)
    .populate('client', 'name email')
    .populate('developers', 'name email')
    .sort({ updatedAt: -1 });

  res.json({ projects: items.map(toView) });
}

export async function getProject(req, res) {
  const p = await Project.findById(req.params.projectId)
    .populate('client', 'name email')
    .populate('developers', 'name email');
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: toView(p) });
}

export async function createProject(req, res) {
  const payload = fromView(req.body);
  if (!payload.name || !payload.name.trim()) return res.status(400).json({ message: 'Title is required' });
  const created = await Project.create(payload);
  res.status(201).json({ project: toView(created) });
}

export async function updateProject(req, res) {
  const patch = fromView(req.body);
  const upd = await Project.findByIdAndUpdate(req.params.projectId, patch, { new: true })
    .populate('client', 'name email')
    .populate('developers', 'name email');
  if (!upd) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: toView(upd) });
}

export async function deleteProject(req, res) {
  const ok = await Project.findByIdAndDelete(req.params.projectId);
  if (!ok) return res.status(404).json({ message: 'Project not found' });
  res.json({ message: 'Deleted' });
}