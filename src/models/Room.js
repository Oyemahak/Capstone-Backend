import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const RoomSchema = new Schema(
  {
    project: { type: Types.ObjectId, ref: 'Project', unique: true, index: true },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Room', RoomSchema);