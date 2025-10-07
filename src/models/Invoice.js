// backend/src/models/Invoice.js
import mongoose from "mongoose";

const FileRef = new mongoose.Schema(
  { name: String, type: String, size: Number, url: String, path: String },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true, required: true },
    kind: { type: String, enum: ["advance", "final", "other"], default: "advance" },
    status: { type: String, enum: ["uploaded", "paid"], default: "uploaded" },
    file: FileRef,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", InvoiceSchema);