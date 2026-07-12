// backend/src/features/projects/controllers/project.controller.js
import Project from '../../../models/Project.js';

/* Populate user refs consistently */
const POP = [
  { path: 'client', select: 'name email role status' },
  { path: 'developer', select: 'name email role status' },
];

const PORTFOLIO_FIELDS = [
  'shortDescription',
  'fullDescription',
  'projectClassification',
  'industry',
  'websiteType',
  'platform',
  'technologies',
  'repositoryUrl',
  'liveUrl',
  'thumbnail',
  'mockupImages',
  'galleryImages',
  'featured',
  'published',
  'displayOrder',
  'completionDate',
  'clientName',
  'projectOverview',
  'challenge',
  'solution',
  'keyFeatures',
  'responsiveHighlights',
  'servicesProvided',
  'resultSummary',
  'seoTitle',
  'seoDescription',
  'imageAltText',
];

const PUBLIC_SELECT = [
  'title',
  'slug',
  'summary',
  ...PORTFOLIO_FIELDS,
].join(' ');

function canReadProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;
  if (String(project.client || '') === String(user._id)) return true;
  if (String(project.developer || '') === String(user._id)) return true;
  return false;
}

function canWriteProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;
  return user.role === 'developer' && String(project.developer || '') === String(user._id);
}

function projectScopeFor(user) {
  if (!user || user.role === 'admin') return {};
  if (user.role === 'developer') return { developer: user._id };
  return { client: user._id };
}

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function sortSpec(value = '') {
  const sorts = {
    newest: { updatedAt: -1, createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
    display: { featured: -1, displayOrder: 1, updatedAt: -1 },
    completed: { completionDate: -1, updatedAt: -1 },
  };
  return sorts[value] || sorts.newest;
}

function addRegexFilter(cond, field, value) {
  if (value) cond[field] = { $regex: value, $options: 'i' };
}

/** GET /api/projects?status=&q=&classification=&industry=&published=&featured=&sort= */
export async function listProjects(req, res) {
  const {
    q = '',
    status,
    classification,
    industry,
    websiteType,
    platform,
    client,
    developer,
    sort = 'newest',
  } = req.query;
  const published = parseBool(req.query.published);
  const featured = parseBool(req.query.featured);

  const cond = projectScopeFor(req.user);
  if (status) cond.status = status;
  if (classification) cond.projectClassification = classification;
  if (published !== undefined) cond.published = published;
  if (featured !== undefined) cond.featured = featured;
  if (req.user?.role === 'admin' && client) cond.client = client;
  if (req.user?.role === 'admin' && developer) cond.developer = developer;
  addRegexFilter(cond, 'industry', industry);
  addRegexFilter(cond, 'websiteType', websiteType);
  addRegexFilter(cond, 'platform', platform);

  if (q) {
    const rx = { $regex: q, $options: 'i' };
    cond.$or = [
      { title: rx },
      { slug: rx },
      { summary: rx },
      { shortDescription: rx },
      { clientName: rx },
      { industry: rx },
      { websiteType: rx },
      { platform: rx },
      { technologies: rx },
      { servicesProvided: rx },
    ];
  }

  const projects = await Project.find(cond).sort(sortSpec(sort)).populate(POP);
  res.json({ projects, total: projects.length });
}

/** GET /api/public/projects?industry=&classification=&q= */
export async function listPublicProjects(req, res) {
  const { q = '', industry, classification, websiteType } = req.query;

  const cond = { published: true };
  if (industry) cond.industry = industry;
  if (classification) cond.projectClassification = classification;
  if (websiteType) cond.websiteType = websiteType;
  if (q) {
    const rx = { $regex: q, $options: 'i' };
    cond.$or = [
      { title: rx },
      { summary: rx },
      { shortDescription: rx },
      { fullDescription: rx },
      { industry: rx },
      { websiteType: rx },
      { platform: rx },
      { technologies: rx },
      { servicesProvided: rx },
    ];
  }

  const projects = await Project.find(cond)
    .select(PUBLIC_SELECT)
    .sort({ featured: -1, displayOrder: 1, completionDate: -1, createdAt: -1 })
    .lean();

  res.json({ projects });
}

/** GET /api/public/projects/:slug */
export async function getPublicProject(req, res) {
  const { slug } = req.params;
  const project = await Project.findOne({ slug, published: true }).select(PUBLIC_SELECT).lean();
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ project });
}

/** GET /api/projects/:projectId */
export async function getProject(req, res) {
  const { projectId } = req.params;
  const project = await Project.findById(projectId).populate(POP);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!canReadProject(req.user, project)) return res.status(403).json({ message: 'Forbidden' });
  res.json({ project });
}

/** POST /api/projects  (admin) */
export async function createProject(req, res) {
  const {
    title,
    summary = '',
    status = 'draft',
    client = null,
    developer = null,
    ...rest
  } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

  const portfolioPatch = {};
  for (const key of PORTFOLIO_FIELDS) {
    if (key in rest) portfolioPatch[key] = rest[key];
  }

  const created = await Project.create({
    title: title.trim(),
    summary: summary.trim?.() || '',
    status,
    client: client || null,
    developer: developer || null,
    ...portfolioPatch,
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
  const isAssignedDev = req.user?.role === 'developer' && canWriteProject(req.user, project);

  if (!isAdmin && !isAssignedDev) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Build patch based on role
  const adminAllowed = [
    'title',
    'summary',
    'status',
    'client',
    'developer',
    'evidence',
    'announcements',
    ...PORTFOLIO_FIELDS,
  ];
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

/** DELETE /api/projects/:projectId (admin)
 * Kept for backward compatibility, but archives instead of hard-deleting.
 */
export async function deleteProject(req, res) {
  const { projectId } = req.params;
  const doc = await Project.findByIdAndUpdate(
    projectId,
    { status: 'archived', published: false, featured: false },
    { new: true, runValidators: true }
  ).populate(POP);
  if (!doc) return res.status(404).json({ message: 'Project not found' });
  res.json({ ok: true, archived: true, project: doc });
}

export const removeProject = deleteProject;

export async function archiveProject(req, res) {
  const { projectId } = req.params;
  const project = await Project.findByIdAndUpdate(
    projectId,
    { status: 'archived', published: false, featured: false },
    { new: true, runValidators: true }
  ).populate(POP);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ ok: true, project });
}

export async function publishProject(req, res) {
  const { projectId } = req.params;
  const published = parseBool(req.body?.published);
  const project = await Project.findByIdAndUpdate(
    projectId,
    { published: published !== undefined ? published : true },
    { new: true, runValidators: true }
  ).populate(POP);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ ok: true, project });
}

export async function featureProject(req, res) {
  const { projectId } = req.params;
  const featured = parseBool(req.body?.featured);
  const project = await Project.findByIdAndUpdate(
    projectId,
    { featured: featured !== undefined ? featured : true },
    { new: true, runValidators: true }
  ).populate(POP);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ ok: true, project });
}

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
  if (!canWriteProject(me, project)) return res.status(403).json({ message: 'Forbidden' });

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
  const project = await Project.findById(projectId).select('announcements client developer').lean();
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!canReadProject(req.user, project)) return res.status(403).json({ message: 'Forbidden' });
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
  if (!canWriteProject(me, project)) return res.status(403).json({ message: 'Forbidden' });

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
