// src/models/Project.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['new','in-progress','paused','completed'], default: 'new' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', ProjectSchema);
export default Project;