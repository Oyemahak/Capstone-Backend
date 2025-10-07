// backend/src/models/Requirement.js
import mongoose from "mongoose";

const FileRefSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    size: Number,
    path: String,
    url: String,
  },
  { _id: false }
);

const PageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    files: { type: [FileRefSchema], default: [] },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const RequirementSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true, unique: true },
    client:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    logo:    FileRefSchema,
    brief:   FileRefSchema,
    supporting: { type: [FileRefSchema], default: [] },
    pages: { type: [PageSchema], default: [] },
    reviewedByDev: { type: Boolean, default: false },
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Requirement", RequirementSchema);