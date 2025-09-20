import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },      // the client owner
    developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // assigned devs
    status: { type: String, enum: ['new', 'in-progress', 'paused', 'completed'], default: 'new' },
    description: String
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);