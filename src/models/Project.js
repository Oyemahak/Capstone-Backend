// backend/src/models/Project.js
import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

// ─────────────────────────────────────────────────────────────
// Evidence (unchanged from your current shape)
// ─────────────────────────────────────────────────────────────
const EvidenceImageSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    type: { type: String, trim: true },
    url:  { type: String, trim: true, required: true },
  },
  { _id: false }
);

const EvidenceEntrySchema = new mongoose.Schema(
  {
    title:  { type: String, trim: true, default: '' },
    links:  [{ type: String, trim: true }],
    images: [EvidenceImageSchema],
    ts:     { type: Number, default: () => Date.now() },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who added it
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
 // NEW: Announcements (persisted timeline; visible to all, created by Admin/Dev)
// ─────────────────────────────────────────────────────────────
const AnnouncementEntrySchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, trim: true },
    body:   { type: String, default: '', trim: true },
    ts:     { type: Number, default: () => Date.now() },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who posted
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────
const ProjectSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    slug:      { type: String, unique: true, index: true },
    summary:   { type: String, default: '', trim: true },
    status:    { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },

    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Evidence timeline (Admin/Dev create)
    evidence:       { type: [EvidenceEntrySchema],      default: [] },

    // NEW: Announcements timeline (Admin/Dev create)
    announcements:  { type: [AnnouncementEntrySchema],  default: [] },
  },
  { timestamps: true }
);

// Always produce a unique slug from title
ProjectSchema.pre('validate', async function (next) {
  if (!this.isModified('title') && this.slug) return next();

  const base = slugify(this.title || '').slice(0, 80) || `project-${Date.now()}`;
  let candidate = base;
  let n = 1;

  const exists = async (s) => {
    const q = { slug: s };
    if (this._id) q._id = { $ne: this._id };
    const c = await this.constructor.countDocuments(q);
    return c > 0;
  };

  while (await exists(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  this.slug = candidate;
  next();
});

const Project = mongoose.model('Project', ProjectSchema);
export default Project;