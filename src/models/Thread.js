import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const ThreadSchema = new Schema(
  {
    type: { type: String, enum: ["dm"], default: "dm" },
    // Do NOT also set { index: true } here if you’re adding schema.index(...) below.
    participants: [{ type: Types.ObjectId, ref: "User" }], // exactly two users
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Single composite index; remove any duplicate definitions elsewhere.
ThreadSchema.index({ participants: 1 });

export default mongoose.model("Thread", ThreadSchema);