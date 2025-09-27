// src/models/Project.js
import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const ProjectSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    slug:      { type: String, unique: true, index: true }, // will be set in pre-validate
    summary:   { type: String, default: '', trim: true },
    status:    { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Always produce a unique slug from title
ProjectSchema.pre('validate', async function (next) {
  if (!this.isModified('title') && this.slug) return next();

  const base = slugify(this.title || '').slice(0, 80) || `project-${Date.now()}`;
  let candidate = base;
  let n = 1;

  // If editing existing doc, ignore collision with itself
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