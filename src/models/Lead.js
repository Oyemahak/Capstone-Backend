// src/models/Lead.js
import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    ip: String,
    ua: String,
  },
  { timestamps: true }
);

export default mongoose.model("Lead", LeadSchema);