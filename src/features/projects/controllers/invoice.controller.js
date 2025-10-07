// backend/src/features/projects/controllers/invoice.controller.js
import Invoice from "../../../models/Invoice.js";
import Project from "../../../models/Project.js";

function canRead(user, project) {
  if (!user || !project) return false;
  if (String(project.client) === String(user._id)) return true;
  if (String(project.developer) === String(user._id)) return true;
  return user.role === "admin";
}
function canWrite(user, project) {
  if (!user || !project) return false;
  if (user.role === "admin") return true;
  // developer may upload deliverable-related invoices if you want; default no
  return String(project.client) === String(user._id);
}

// GET /api/projects/:projectId/invoices
export async function listInvoices(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canRead(req.user, project)) return res.status(403).json({ error: "Forbidden" });
    const rows = await Invoice.find({ project: projectId }).sort({ createdAt: -1 }).lean();
    res.json({ invoices: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/projects/:projectId/invoices
export async function createInvoice(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canWrite(req.user, project)) return res.status(403).json({ error: "Forbidden" });

    // Expect client to upload the file first via /api/files/upload, then send the file ref here
    const { kind = "advance", file } = req.body || {};
    if (!file?.path) return res.status(400).json({ error: "file {path,url,name,type,size} required" });

    const doc = await Invoice.create({
      project: projectId,
      kind,
      status: "uploaded",
      file,
      uploadedBy: req.user._id,
    });
    res.status(201).json({ ok: true, invoice: doc });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/projects/:projectId/invoices/:invoiceId
export async function updateInvoice(req, res, next) {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { invoiceId } = req.params;
    const { status = "paid" } = req.body || {};
    const doc = await Invoice.findByIdAndUpdate(invoiceId, { status, paidAt: status === "paid" ? new Date() : null }, { new: true });
    res.json({ ok: true, invoice: doc });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:projectId/invoices/:invoiceId
export async function deleteInvoice(req, res, next) {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { invoiceId } = req.params;
    await Invoice.findByIdAndDelete(invoiceId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}