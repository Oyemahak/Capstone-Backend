// backend/src/models/Project.js
import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

// Small subdocs used by evidence
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
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    slug:      { type: String, unique: true, index: true },
    summary:   { type: String, default: '', trim: true },
    status:    { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // NEW: evidence timeline persisted by Admin/Dev
    evidence:  { type: [EvidenceEntrySchema], default: [] },
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