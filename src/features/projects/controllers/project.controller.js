import Project from '../../../models/Project.js';
import Task from '../../../models/Task.js';
import slugify from '../../../utils/slugify.js';

export async function createProject(req, res) {
  const { name, client, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const project = await Project.create({
    name,
    slug: slugify(name),
    client: client || null,
    developers: [],
    description: description || ''
  });
  res.status(201).json({ project });
}

export async function listProjects(req, res) {
  const user = req.user;
  let query = {};

  if (user.role === 'developer') {
    query = { developers: user._id };
  } else if (user.role === 'client') {
    query = { client: user._id };
  } // admin sees all

  const projects = await Project.find(query)
    .populate('client', 'name email')
    .populate('developers', 'name email')
    .sort({ createdAt: -1 });

  res.json({ projects });
}

export async function getProject(req, res) {
  const p = await Project.findById(req.params.projectId)
    .populate('client', 'name email')
    .populate('developers', 'name email');
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: p });
}

export async function updateProject(req, res) {
  const updates = (({ name, description, status }) => ({ name, description, status }))(req.body);
  if (updates.name) updates.slug = slugify(updates.name);
  const p = await Project.findByIdAndUpdate(req.params.projectId, updates, { new: true });
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: p });
}

export async function assignDevelopers(req, res) {
  const { developerIds = [] } = req.body; // [userId]
  const p = await Project.findByIdAndUpdate(
    req.params.projectId,
    { $addToSet: { developers: { $each: developerIds } } },
    { new: true }
  ).populate('developers', 'name email');
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: p });
}

// Tasks (very simple)
export async function addTask(req, res) {
  const { title, assignee, notes } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const task = await Task.create({ project: req.params.projectId, title, assignee, notes });
  res.status(201).json({ task });
}

export async function listTasks(req, res) {
  const tasks = await Task.find({ project: req.params.projectId })
    .populate('assignee', 'name email')
    .sort({ createdAt: -1 });
  res.json({ tasks });
}